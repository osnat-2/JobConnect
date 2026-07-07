using System.Text;
using System.Text.Json;
using CandidateService.DTO;
using CandidateService.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace CandidateService.Services;

public class DocumentParsedListener : BackgroundService
{
    private readonly string _hostName;
    private readonly ILogger<DocumentParsedListener> _logger;
    private readonly IServiceProvider _serviceProvider;
    private IConnection? _connection;
    private IChannel? _channel;

    private const string ExchangeName = "application-events";
    private const string QueueName = "candidate-service-document-parsed-queue";
    private const string DlxName = "candidate-service-document-parsed-dlx";
    private const string DlqName = "candidate-service-document-parsed-dlq";

    public DocumentParsedListener(IConfiguration configuration, IServiceProvider serviceProvider, ILogger<DocumentParsedListener> logger)
    {
        _hostName = configuration["RABBITMQ__HOST"] ?? configuration["RABBITMQ:HOST"] ?? "localhost";
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var factory = new ConnectionFactory
        {
            HostName = _hostName,
            AutomaticRecoveryEnabled = true
        };

        _connection = await factory.CreateConnectionAsync(stoppingToken);
        _channel = await _connection.CreateChannelAsync(new CreateChannelOptions(false, false, null, null), stoppingToken);

        await _channel.ExchangeDeclareAsync(ExchangeName, ExchangeType.Topic, durable: true, autoDelete: false, arguments: null, passive: false, noWait: false, cancellationToken: stoppingToken);
        await _channel.ExchangeDeclareAsync(DlxName, ExchangeType.Fanout, durable: true, autoDelete: false, arguments: null, passive: false, noWait: false, cancellationToken: stoppingToken);

        var queueArguments = new Dictionary<string, object?>
        {
            ["x-dead-letter-exchange"] = DlxName,
            ["x-dead-letter-routing-key"] = "candidate-service-document-parsed"
        };

        await _channel.QueueDeclareAsync(QueueName, durable: true, exclusive: false, autoDelete: false, arguments: queueArguments, passive: false, noWait: false, cancellationToken: stoppingToken);
        await _channel.QueueBindAsync(QueueName, ExchangeName, "DocumentParsed", arguments: null, noWait: false, cancellationToken: stoppingToken);
        await _channel.QueueBindAsync(QueueName, ExchangeName, "DocumentParsingFailed", arguments: null, noWait: false, cancellationToken: stoppingToken);

        await _channel.QueueDeclareAsync(DlqName, durable: true, exclusive: false, autoDelete: false, arguments: null, passive: false, noWait: false, cancellationToken: stoppingToken);
        await _channel.QueueBindAsync(DlqName, DlxName, "candidate-service-document-parsed", arguments: null, noWait: false, cancellationToken: stoppingToken);

        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.ReceivedAsync += OnMessageReceivedAsync;
        await _channel.BasicConsumeAsync(queue: QueueName, autoAck: false, consumerTag: string.Empty, noLocal: false, exclusive: false, arguments: null, consumer: consumer, cancellationToken: stoppingToken);

        _logger.LogInformation("DocumentParsedListener started and listening for RabbitMQ events.");
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        await StopConnectionAsync(cancellationToken);
        await base.StopAsync(cancellationToken);
    }

    private async Task StopConnectionAsync(CancellationToken cancellationToken)
    {
        try
        {
            if (_channel is not null)
            {
                await _channel.CloseAsync(cancellationToken);
                _channel.Dispose();
            }

            if (_connection is not null)
            {
                await _connection.CloseAsync(cancellationToken);
                _connection.Dispose();
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Exception while closing RabbitMQ resources.");
        }
    }

    private async Task OnMessageReceivedAsync(object? sender, BasicDeliverEventArgs args)
    {
        if (_channel is null)
        {
            return;
        }

        var correlationId = ExtractCorrelationId(args.BasicProperties);
        var routingKey = args.RoutingKey;
        var bodyText = Encoding.UTF8.GetString(args.Body.ToArray());

        try
        {
            using var document = JsonDocument.Parse(bodyText);
            var root = document.RootElement;

            if (routingKey == "DocumentParsed")
            {
                await HandleDocumentParsedAsync(root, correlationId);
            }
            else if (routingKey == "DocumentParsingFailed")
            {
                await HandleDocumentParsingFailedAsync(root, correlationId);
            }
            else
            {
                _logger.LogWarning("Ignoring unsupported event routing key {RoutingKey}.", routingKey);
            }

            await _channel.BasicAckAsync(args.DeliveryTag, multiple: false, cancellationToken: CancellationToken.None);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to deserialize RabbitMQ payload for correlation {CorrelationId}.", correlationId);
            await _channel.BasicNackAsync(args.DeliveryTag, multiple: false, requeue: false, cancellationToken: CancellationToken.None);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error processing RabbitMQ event for correlation {CorrelationId}.", correlationId);
            await _channel.BasicNackAsync(args.DeliveryTag, multiple: false, requeue: true, cancellationToken: CancellationToken.None);
        }
    }

    private static string ExtractCorrelationId(IReadOnlyBasicProperties? properties)
    {
        if (properties?.Headers is not null && properties.Headers.TryGetValue("X-Correlation-ID", out var headerValue))
        {
            if (headerValue is byte[] bytes)
            {
                return Encoding.UTF8.GetString(bytes);
            }

            return headerValue?.ToString() ?? Guid.NewGuid().ToString("N");
        }

        return Guid.NewGuid().ToString("N");
    }

    private async Task HandleDocumentParsedAsync(JsonElement payload, string correlationId)
    {
        var documentId = TryGetGuid(payload, "documentId");
        var candidateId = TryGetGuid(payload, "candidateId");
        var parsedText = TryGetString(payload, "parsedText");

        if (documentId == null || candidateId == null || parsedText is null)
        {
            throw new InvalidOperationException("DocumentParsed event missing required fields.");
        }

        using var scope = _serviceProvider.CreateScope();
        var documentService = scope.ServiceProvider.GetRequiredService<CandidateDocumentService>();
        var request = new ParsedCandidateDocumentRequest
        {
            ParsedText = parsedText,
            Status = "Parsed",
        };

        var result = await documentService.UpdateParsedAsync(candidateId.Value, documentId.Value, request, CancellationToken.None);
        if (result is null)
        {
            _logger.LogWarning("Candidate document not found for parsed event. DocumentId={DocumentId} CandidateId={CandidateId} CorrelationId={CorrelationId}.", documentId, candidateId, correlationId);
        }
        else
        {
            _logger.LogInformation("Successfully updated parsed document. DocumentId={DocumentId} CandidateId={CandidateId} CorrelationId={CorrelationId}.", documentId, candidateId, correlationId);
        }
    }

    private async Task HandleDocumentParsingFailedAsync(JsonElement payload, string correlationId)
    {
        var documentId = TryGetGuid(payload, "documentId");
        var candidateId = TryGetGuid(payload, "candidateId");

        if (documentId == null || candidateId == null)
        {
            throw new InvalidOperationException("DocumentParsingFailed event missing required fields.");
        }

        using var scope = _serviceProvider.CreateScope();
        var documentService = scope.ServiceProvider.GetRequiredService<CandidateDocumentService>();
        var request = new ParsedCandidateDocumentRequest
        {
            ParsedText = string.Empty,
            Status = "Failed",
        };

        var result = await documentService.UpdateParsedAsync(candidateId.Value, documentId.Value, request, CancellationToken.None);
        if (result is null)
        {
            _logger.LogWarning("Candidate document not found for failed parse event. DocumentId={DocumentId} CandidateId={CandidateId} CorrelationId={CorrelationId}.", documentId, candidateId, correlationId);
        }
        else
        {
            _logger.LogInformation("Updated candidate document to failed state. DocumentId={DocumentId} CandidateId={CandidateId} CorrelationId={CorrelationId}.", documentId, candidateId, correlationId);
        }
    }

    private static Guid? TryGetGuid(JsonElement payload, string propertyName)
    {
        return payload.TryGetProperty(propertyName, out var property) && property.ValueKind == JsonValueKind.String && Guid.TryParse(property.GetString(), out var value)
            ? value
            : null;
    }

    private static string? TryGetString(JsonElement payload, string propertyName)
    {
        return payload.TryGetProperty(propertyName, out var property) && property.ValueKind == JsonValueKind.String
            ? property.GetString()
            : null;
    }
}

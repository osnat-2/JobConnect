using System.Text;
using System.Text.Json;
using CandidateService.Interfaces;
using RabbitMQ.Client;

namespace CandidateService.Services;

public class RabbitMqEventPublisher : IEventPublisher
{
    private readonly string _hostName;
    private readonly int _hostPort;

    public RabbitMqEventPublisher(IConfiguration configuration)
    {
        _hostName = configuration["RABBITMQ__HOST"] ?? configuration["RABBITMQ:HOST"] ?? "localhost";
        _hostPort = int.TryParse(configuration["RABBITMQ__PORT"] ?? configuration["RABBITMQ:PORT"], out var port) ? port : 5672;
    }

    public async Task PublishAsync(string eventName, object payload, CancellationToken cancellationToken = default)
    {
        var factory = new ConnectionFactory
        {
            HostName = _hostName,
            Port = _hostPort,
            AutomaticRecoveryEnabled = true
        };

        using var connection = await factory.CreateConnectionAsync(cancellationToken);
        using var channel = await connection.CreateChannelAsync(new CreateChannelOptions(false, false, null, null), cancellationToken);

        await channel.ExchangeDeclareAsync("application-events", ExchangeType.Topic, durable: true, autoDelete: false, arguments: null, passive: false, noWait: false, cancellationToken: cancellationToken);

        var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payload));
        var props = new BasicProperties();
        await channel.BasicPublishAsync("application-events", eventName, false, props, body, cancellationToken);
    }
}

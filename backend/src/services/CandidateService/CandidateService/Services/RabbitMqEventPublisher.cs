using System.Text;
using System.Text.Json;
using CandidateService.Interfaces;
using RabbitMQ.Client;

namespace CandidateService.Services;

public class RabbitMqEventPublisher : IEventPublisher
{
    private readonly string _hostName;

    public RabbitMqEventPublisher(IConfiguration configuration)
    {
        _hostName = configuration["RABBITMQ__HOST"] ?? "localhost";
    }

    public async Task PublishAsync(string eventName, object payload, CancellationToken cancellationToken = default)
    {
        var factory = new ConnectionFactory
        {
            HostName = _hostName,
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

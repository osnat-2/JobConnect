using System.Text;
using System.Text.Json;
using ApplicationService.Interfaces;
using RabbitMQ.Client;

namespace ApplicationService.Services;

public class RabbitMqEventPublisher : IEventPublisher
{
    private readonly string _hostName;

    public RabbitMqEventPublisher(IConfiguration configuration)
    {
        _hostName = configuration["RABBITMQ__HOST"] ?? "localhost";
    }

    public Task PublishAsync(string eventName, object payload, CancellationToken cancellationToken = default)
    {
        try
        {
            var factory = new ConnectionFactory { HostName = _hostName, AutomaticRecoveryEnabled = true };
            using var connection = factory.CreateConnection();
            using var channel = connection.CreateModel();

            channel.ExchangeDeclare("application-events", ExchangeType.Topic, durable: true);
            var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payload));
            channel.BasicPublish("application-events", eventName, body: body);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to publish event {eventName}: {ex.Message}");
        }

        return Task.CompletedTask;
    }
}

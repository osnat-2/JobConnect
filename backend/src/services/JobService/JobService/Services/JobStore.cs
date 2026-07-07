using System.Text;
using System.Text.Json;
using AutoMapper;
using JobService.DTO;
using JobService.Interfaces;
using JobService.Models;
using Microsoft.Extensions.Configuration;
using MongoDB.Bson;
using MongoDB.Driver;
using RabbitMQ.Client;
using StackExchange.Redis;

namespace JobService.Services;

public class JobStore : IJobStore
{
    private const string HotJobsCacheKey = "jobservice:hotjobs";
    private readonly IMongoCollection<JobDocument> _jobs;
    private readonly ILogger<JobStore> _logger;
    private readonly IMapper _mapper;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IConnectionMultiplexer? _redis;
    private readonly string? _rabbitMqHost;

    public JobStore(IMongoClient mongoClient, ILogger<JobStore> logger, IConfiguration configuration, IHttpContextAccessor httpContextAccessor, IMapper mapper)
    {
        _logger = logger;
        _mapper = mapper;
        _httpContextAccessor = httpContextAccessor;
        var databaseName = configuration["MONGO__DATABASE"] ?? configuration["MONGO:DATABASE"] ?? "jobs";
        var database = mongoClient.GetDatabase(databaseName);
        _jobs = database.GetCollection<JobDocument>("jobs");
        _rabbitMqHost = configuration["RABBITMQ__HOST"] ?? configuration["RABBITMQ:HOST"];

        var redisHost = configuration["REDIS__HOST"] ?? configuration["REDIS:HOST"] ?? "localhost";
        var redisPort = configuration["REDIS__PORT"] ?? configuration["REDIS:PORT"] ?? "6379";

        try
        {
            _redis = ConnectionMultiplexer.Connect($"{redisHost}:{redisPort}");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis is unavailable. Hot job reads will fall back to MongoDB.");
        }
    }

    public async Task<IReadOnlyList<JobDocument>> ListAsync(string? query, string? location, string? category, int page, int pageSize)
    {
        var filters = new List<FilterDefinition<JobDocument>>();

        if (!string.IsNullOrWhiteSpace(query))
        {
            var search = query.Trim();
            filters.Add(Builders<JobDocument>.Filter.Or(
                Builders<JobDocument>.Filter.Regex(x => x.Title, new BsonRegularExpression(search, "i")),
                Builders<JobDocument>.Filter.Regex(x => x.Company, new BsonRegularExpression(search, "i")),
                Builders<JobDocument>.Filter.Regex(x => x.Description, new BsonRegularExpression(search, "i"))));
        }

        if (!string.IsNullOrWhiteSpace(location))
        {
            filters.Add(Builders<JobDocument>.Filter.Regex(x => x.Location, new BsonRegularExpression(location.Trim(), "i")));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            filters.Add(Builders<JobDocument>.Filter.Regex(x => x.Category, new BsonRegularExpression(category.Trim(), "i")));
        }

        var filter = filters.Count > 0 ? Builders<JobDocument>.Filter.And(filters) : Builders<JobDocument>.Filter.Empty;
        var skip = Math.Max(page - 1, 0) * Math.Max(pageSize, 1);

        return await _jobs.Find(filter)
            .Sort(Builders<JobDocument>.Sort.Descending(x => x.PostedAt))
            .Skip(skip)
            .Limit(Math.Max(pageSize, 1))
            .ToListAsync();
    }

    public async Task<JobDocument?> GetByIdAsync(string id)
    {
        return await _jobs.Find(x => x.Id == id).FirstOrDefaultAsync();
    }

    public async Task<JobDocument> CreateAsync(CreateJobRequest request)
    {
        var document = _mapper.Map<JobDocument>(request);
        document.Id = Guid.NewGuid().ToString("N");
        document.PostedAt = DateTimeOffset.UtcNow;

        await _jobs.InsertOneAsync(document);
        await PublishJobEventAsync("JobCreated", document);
        return document;
    }

    public async Task<JobDocument?> UpdateAsync(string id, UpdateJobRequest request)
    {
        var existing = await _jobs.Find(x => x.Id == id).FirstOrDefaultAsync();
        if (existing is null)
        {
            return null;
        }

        var updated = _mapper.Map(request, existing);
        await _jobs.ReplaceOneAsync(x => x.Id == id, updated);
        await PublishJobEventAsync("JobUpdated", updated);

        return updated;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _jobs.DeleteOneAsync(x => x.Id == id);
        if (result.DeletedCount > 0)
        {
            await PublishJobEventAsync("JobDeleted", new JobDocument { Id = id });
            return true;
        }

        return false;
    }

    public async Task<IReadOnlyList<JobDocument>> GetHotJobsAsync(int take)
    {
        if (_redis is not null)
        {
            var db = _redis.GetDatabase();
            var cached = await db.StringGetAsync(HotJobsCacheKey);
            if (cached.HasValue)
            {
                try
                {
                    var jobs = JsonSerializer.Deserialize<List<JobDocument>>(cached!, new JsonSerializerOptions(JsonSerializerDefaults.Web));
                    if (jobs is not null && jobs.Count > 0)
                    {
                        return jobs.Take(take).ToList();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Unable to deserialize cached hot jobs. Falling back to MongoDB.");
                }
            }
        }

        var hotJobs = await ListAsync(null, null, null, 1, take);
        if (_redis is not null)
        {
            var db = _redis.GetDatabase();
            await db.StringSetAsync(HotJobsCacheKey, JsonSerializer.Serialize(hotJobs), TimeSpan.FromMinutes(10));
        }

        return hotJobs;
    }

    private Task PublishJobEventAsync(string eventName, JobDocument document)
    {
        if (string.IsNullOrWhiteSpace(_rabbitMqHost))
        {
            return Task.CompletedTask;
        }

        try
        {
            var factory = new ConnectionFactory { HostName = _rabbitMqHost };
            using var connection = factory.CreateConnection();
            using var channel = connection.CreateModel();

            var properties = channel.CreateBasicProperties();
            var correlationId = GetCorrelationId();
            properties.CorrelationId = correlationId;
            properties.ContentType = "application/json";

            var payload = JsonSerializer.Serialize(new
            {
                EventName = eventName,
                Job = document,
                OccurredAt = DateTimeOffset.UtcNow,
                CorrelationId = correlationId
            });

            channel.BasicPublish(exchange: string.Empty, routingKey: "job-events", mandatory: false, basicProperties: properties, body: Encoding.UTF8.GetBytes(payload));
            return Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Unable to publish event {EventName} to RabbitMQ.", eventName);
            return Task.CompletedTask;
        }
    }

    private string GetCorrelationId()
    {
        return _httpContextAccessor.HttpContext?.Request.Headers["X-Correlation-ID"].ToString()
            ?? Guid.NewGuid().ToString("N");
    }
}

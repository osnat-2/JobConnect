using AutoMapper;
using JobService.DTO;
using JobService.Models;

namespace JobService.Profiles;

public class JobMappingProfile : Profile
{
    public JobMappingProfile()
    {
        CreateMap<CreateJobRequest, JobDocument>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.PostedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Title, opt => opt.MapFrom(src => NormalizeText(src.Title)))
            .ForMember(dest => dest.Company, opt => opt.MapFrom(src => NormalizeText(src.Company)))
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => NormalizeText(src.Description)))
            .ForMember(dest => dest.Location, opt => opt.MapFrom(src => NormalizeText(src.Location)))
            .ForMember(dest => dest.Category, opt => opt.MapFrom(src => NormalizeText(src.Category)))
            .ForMember(dest => dest.EmploymentType, opt => opt.MapFrom(src => NormalizeText(src.EmploymentType)))
            .ForMember(dest => dest.Requirements, opt => opt.MapFrom(src => NormalizeArray(src.Requirements)))
            .ForMember(dest => dest.Tags, opt => opt.MapFrom(src => NormalizeArray(src.Tags)));

        CreateMap<UpdateJobRequest, JobDocument>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.PostedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Title, opt => opt.MapFrom(src => NormalizeText(src.Title)))
            .ForMember(dest => dest.Company, opt => opt.MapFrom(src => NormalizeText(src.Company)))
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => NormalizeText(src.Description)))
            .ForMember(dest => dest.Location, opt => opt.MapFrom(src => NormalizeText(src.Location)))
            .ForMember(dest => dest.Category, opt => opt.MapFrom(src => NormalizeText(src.Category)))
            .ForMember(dest => dest.EmploymentType, opt => opt.MapFrom(src => NormalizeText(src.EmploymentType)))
            .ForMember(dest => dest.Requirements, opt => opt.MapFrom(src => NormalizeArray(src.Requirements)))
            .ForMember(dest => dest.Tags, opt => opt.MapFrom(src => NormalizeArray(src.Tags)))
            .ForAllMembers(opt => opt.Condition((_, _, sourceMember) =>
                sourceMember is not null &&
                (sourceMember is not string || !string.IsNullOrWhiteSpace((string)sourceMember))));
    }

    private static string NormalizeText(string? value) => string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();

    private static string[] NormalizeArray(IEnumerable<string>? values) =>
        values?
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .ToArray() ?? Array.Empty<string>();
}

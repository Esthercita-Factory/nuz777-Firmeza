namespace Firmeza.Application.Common;

public sealed record PageRequest
{
    private const int MaxPageSize = 100;

    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 20;

    public int Skip => (Page > 0 ? Page - 1 : 0) * PageSize;

    public int Take => PageSize is > MaxPageSize or <= 0 ? MaxPageSize : PageSize;
}

public sealed record PagedResult<TItem>
{
    public required IReadOnlyList<TItem> Items { get; init; }

    public int TotalCount { get; init; }
}

public sealed record PagedResponse<TItem>
{
    public required IReadOnlyList<TItem> Items { get; init; }

    public int Page { get; init; }

    public int PageSize { get; init; }

    public int TotalCount { get; init; }

    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
}

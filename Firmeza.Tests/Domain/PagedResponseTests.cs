using Firmeza.Application.Common;

namespace Firmeza.Tests.Domain;

public class PageRequestTests
{
    [Fact]
    public void Skip_IsZeroForFirstPage()
    {
        var page = new PageRequest { Page = 1, PageSize = 20 };

        Assert.Equal(0, page.Skip);
        Assert.Equal(20, page.Take);
    }

    [Fact]
    public void Skip_AccountsForPreviousPages()
    {
        var page = new PageRequest { Page = 3, PageSize = 20 };

        Assert.Equal(40, page.Skip);
    }

    [Fact]
    public void Take_CapsPageSize()
    {
        var page = new PageRequest { Page = 1, PageSize = 5000 };

        Assert.Equal(100, page.Take);
    }
}

public class PagedResponseTests
{
    [Fact]
    public void TotalPages_CeilingOfTotalCountOverPageSize()
    {
        var response = new PagedResponse<int> { Items = [], Page = 1, PageSize = 20, TotalCount = 41 };

        Assert.Equal(3, response.TotalPages);
    }

    [Fact]
    public void TotalPages_IsZeroWhenThereAreNoItems()
    {
        var response = new PagedResponse<int> { Items = [], Page = 1, PageSize = 20, TotalCount = 0 };

        Assert.Equal(0, response.TotalPages);
    }
}

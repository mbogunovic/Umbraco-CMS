﻿using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.Linq;
using System.Threading.Tasks;
using Umbraco.Core;
using Umbraco.Core.Hosting;
using Umbraco.Core.Security;
using Umbraco.Core.Services;
using Umbraco.Web.Editors;

namespace Umbraco.Web.BackOffice.Authorization
{

    /// <summary>
    /// if the users being edited is an admin then we must ensure that the current user is also an admin
    /// </summary>
    public class AdminUsersAuthorizeHandler : AuthorizationHandler<AdminUsersAuthorizeRequirement>
    {
        private readonly IHttpContextAccessor _httpContextAcessor;
        private readonly IUserService _userService;
        private readonly IBackOfficeSecurityAccessor _backofficeSecurityAccessor;
        private readonly UserEditorAuthorizationHelper _userEditorAuthorizationHelper;

        public AdminUsersAuthorizeHandler(IHttpContextAccessor httpContextAcessor,
                IUserService userService,
                IBackOfficeSecurityAccessor backofficeSecurityAccessor,
                UserEditorAuthorizationHelper userEditorAuthorizationHelper)
        {
            _httpContextAcessor = httpContextAcessor;
            _userService = userService;
            _backofficeSecurityAccessor = backofficeSecurityAccessor;
            _userEditorAuthorizationHelper = userEditorAuthorizationHelper;
        }

        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, AdminUsersAuthorizeRequirement requirement)
        {
            var isAuth = IsAuthorized(requirement);
            if (!isAuth.HasValue || isAuth.Value)
            {
                context.Succeed(requirement);
            }
            else
            {
                context.Fail();
            }

            return Task.CompletedTask;
        }

        private bool? IsAuthorized(AdminUsersAuthorizeRequirement requirement)
        {
            int[] userIds;

            var queryString = _httpContextAcessor.HttpContext?.Request.Query[requirement.QueryStringName];
            if (!queryString.HasValue) return null; 

            if (int.TryParse(queryString, out var userId))
            {
                userIds = new[] { userId };
            }
            else
            {
                var ids = _httpContextAcessor.HttpContext.Request.Query.Where(x => x.Key == requirement.QueryStringName).ToArray();
                if (ids.Length == 0)
                    return null; 
                userIds = ids.Select(x => x.Value.TryConvertTo<int>()).Where(x => x.Success).Select(x => x.Result).ToArray();
            }

            if (userIds.Length == 0) return null; 

            var users = _userService.GetUsersById(userIds);
            return users.All(user => _userEditorAuthorizationHelper.IsAuthorized(_backofficeSecurityAccessor.BackOfficeSecurity.CurrentUser, user, null, null, null) != false);
        }
    }
}
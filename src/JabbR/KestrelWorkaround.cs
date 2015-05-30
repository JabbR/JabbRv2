using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Mvc.Internal;
using Microsoft.AspNet.Http;

namespace JabbR
{
    
    public static class BuilderExtensions
    {
        public static IApplicationBuilder UseKestrelWorkaround(this IApplicationBuilder app)
        {
            return app.UseMiddleware<KestrelWorkaround>();
        }
    }
    
	// TODO - check to see if this is still needed by Kestrel
    public class KestrelWorkaround
    {
        readonly RequestDelegate next;
 
        public KestrelWorkaround(RequestDelegate next)
        {
            this.next = next;
        }
 
        public async Task Invoke(HttpContext ctx)
        {
            var resp = ctx.Response;
 
            // Replace the body stream with a fake one
            var realBodyStream = resp.Body;
            var fakeBody = new MemoryStream();
            resp.Body = new NonDisposableStream(fakeBody);
 
            await next(ctx);
 
            // Thanks to NonDisposableStream, we can just move the position on our MemoryStream
            fakeBody.Position = 0;
 
            // Swap the real body stream back in
            resp.Body = realBodyStream;
 
            await fakeBody.CopyToAsync(resp.Body);
        }
    }
}
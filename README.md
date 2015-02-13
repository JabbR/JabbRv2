## JabbR - v2
JabbR is a chat application built with ASP.NET 5 using SignalR.

## Prerequisites
To be able to contribute to the project, you need the following new bits:
* [Visual Studio 2015](http://www.visualstudio.com/en-us/downloads/visual-studio-2015-downloads-vs.aspx) or alternatively [OmniSharp](http://www.omnisharp.net/)
* ASP.NET 5 - [Get it here](https://github.com/aspnet/home#getting-started)

## Getting started
To get started, first get the latest version of the ASP.NET 5. You do this by following the [Getting Started](https://github.com/aspnet/home#getting-started) guide down to the point where you have executed the *kvm upgrade* command.
You are now ready to start using ASP.NET 5!

After this open a PowerShell window and browse to your local clone of the JabbRv2 in the folder /src/jabbr. 
Run the command: *kpm restore*
This will install all the required packages needed for the source to build and run.

Next, run the command: *k jabbr*
This will build the source, start the web server and host your local jabbr version on [http://localhost:5000/](http://localhost:5000/).
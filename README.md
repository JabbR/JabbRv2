# JabbR v2 [![Build Status](https://travis-ci.org/alfhenrik/JabbRv2.svg?branch=dev)](https://travis-ci.org/alfhenrik/JabbRv2)

JabbR is a xplat chat web application built with ASP.NET 5 and MVC 6 using SignalR.

## Supported platforms

JabbRv2 can run on the following platforms:
- Windows
- OS X

## Build
JabbRv2 is a web application built on ASP.NET 5, to build and develop JabbRv2 you will need the following:

### Getting started with ASP.NET 5
 - [Windows](https://github.com/aspnet/home#getting-started-on-windows)
 - [OS X](https://github.com/aspnet/home#os-x)

### Code editor

If you are on Windows you can download and install [Visual Studio 2015 RC](https://www.visualstudio.com/downloads/visual-studio-2015-downloads-vs.aspx)

If you are on OS X, or don't want to install and run VS2015 RC, there are a few other options available to you:
- [Visual Studio Code](https://www.visualstudio.com/products/code-vs), Microsofts new xplat code editor.
- [OmniSharp](http://omnisharp.net/) provide plugins for several other popular text editors for both Windows and OS X.

### Windows

Once you've got all the necessary bits mentioned above, run the below:
```
git clone https://github.com/JabbR/JabbRv2.git JabbRv2
cd JabbRv2
.\build.cmd
```

### OSX

If you want to build and develop JabbRv2 on OSX there's a few little hoops that you will have to jump through to get it buildind and running.
- There's currently a bug in the latest public build of Mono (4.0.1) that causes [System.InvalidProgramException: Invalid IL code](https://github.com/aspnet/SignalR-Server/issues/93), the workaround for this is to build Mono from source using their [One Stop Shop Build Script (32-bit)](http://www.mono-project.com/docs/compiling-mono/mac/#one-stop-shop-build-script-32-bit) or install one of the weekly snapshot builds that the mono project provide [here](http://www.mono-project.com/docs/getting-started/install/weekly-packages/).
- There's an issue in the KestrelHttpServer that causes a [server deadlock](https://github.com/aspnet/KestrelHttpServer/issues/103), there is a workaround for this and we've included that in the source (`KestrelWorkaround.cs`).

Once you have the latest mono installed, run the below:
```
git clone https://github.com/JabbR/JabbRv2.git JabbRv2
cd JabbRv2
.\build.sh
```

## Contribute
We welcome contributions from experienced developers. You can get involved by logging bugs in github, hacking on the source, or discussing issues / features in the [#meta](https://jabbr.net/#/rooms/meta) room on JabbR.
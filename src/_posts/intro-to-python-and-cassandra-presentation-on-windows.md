---
title: Intro to Python and Cassandra Presentation on Windows
date: 2014-10-13T19:19:03.236Z
---

My colleague, [Jon Haddad](https://twitter.com/rustyrazorblade), has a great interactive "Intro to Python and Cassandra"
presentation [available on GitHub](https://github.com/rustyrazorblade/python-presentation).

If you want to run through this presentation on Windows though, you might run into a few challenges getting it up and
running.  On my Windows 7 machine with nothing installed, these are the steps I followed to try it out.

1.  If you don't already have Cassandra installed for Windows, grab a copy of the [DataStax Community Edition from
    Planet Cassandra](http://planetcassandra.org/cassandra/).
1.  Install [Python 2.7.8](https://www.python.org/downloads/windows/) using the Windows installer from Python.org.
  * Let the installer add Python to your Windows `PATH` variable (by default, that's disabled)
1.  The changes to your `PATH` environment variable will may require a restart to take effect.
1.  Since Python 2.7.8 doesn't come with `pip` by default, install it by [following the instructions here](
    https://pip.pypa.io/en/latest/installing.html).  Basically you'll:
  * Download `get-pip.py` from that URL
  * Run `python get-pip.py` from a Command Prompt.
  * This will install `pip` under the `Scripts` folder of your Python install (i.e. `c:\Python27\Scripts` by default)
1.  Jon suggests that you use, `virtualenvwrapper` to do the demo in a Python virtual environment.  For Windows users,
    that means using `virtualenvwrapper-win`.  You can install it via `pip` from a Command Prompt:
```
> pip install virtualenvwrapper-win
```

Now you can go ahead and create the virtual environment for the tutorial and get it running.  From a command prompt,
you'll want to run:

```
> mkvirtualenv tutorial
> workon tutorial
```

Then go ahead and clone the repo:

```
> git clone git@github.com:rustyrazorblade/python-presentation.git
```

Then navigate to the repo and run:

```
> pip install -r requirements.txt
```

If you run into an error about `vcvarsall.bat` being missing, you have two options:

1.  If you've already got Visual Studio installed, you can trick Python into using compiler for the version you have
    installed by following [these instructions on
    StackOverflow](http://stackoverflow.com/questions/2817869/error-unable-to-find-vcvarsall-bat).
1.  You can grab the compiler for Python [from Microsoft](http://aka.ms/vcpython27).

Then you should be to start up the tutorial in iPython Notebook by running:

```
> ipython notebook
```

This should launch a browser with the interactive tutorial up and running.

![Running tutorial](/content/images/2014/Oct/2014-10-13_13h13_08.png)

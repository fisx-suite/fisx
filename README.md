fisx
========

> A better front-end solution for development, debug and release based on fis3 using EcomFE spec and AMD spec.


## How to use

The fisx is base on [fis3](http://fis.baidu.com/fis3/index.html). The plugins and features provided by fis3 can also be used in fisx. More about the useage of fis3, please refer to the offical document.


* install

```shell
npm install fisx -g
```

* init project

```
mkdir myProject
cd myProject
fisx init 
```

* start server

```
fisx server start
```

* release

```
fisx release # release codebase used in the development debug environment
fisx release prod # release codebase used in the production environment
```

## Features

* [Scaffold utilities](https://github.com/wuhy/fisx-command-init)
* Component package manage

    * [install](https://github.com/wuhy/fisx-command-install)
    * [uninstall](https://github.com/wuhy/fisx-command-uninstall)
    * [update](https://github.com/wuhy/fisx-command-update)
    * [list](https://github.com/wuhy/fisx-command-list)
    * [search](https://github.com/wuhy/fisx-command-search)

* [Development server](https://github.com/wuhy/fisx-command-server)

## Reference

* [EcomFE spec](https://github.com/ecomfe/spec)

* [AMD spec](https://github.com/amdjs/amdjs-api/wiki/AMD)

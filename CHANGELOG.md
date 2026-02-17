## [1.1.1](https://github.com/elysia-best/apm-app-store/compare/v1.1.0...v1.1.1) (2026-02-17)


### Bug Fixes

* **main:** use app.getVersion() for packaged app ([d45d508](https://github.com/elysia-best/apm-app-store/commit/d45d5082f45d60de69d07998429d6f49c64a7b95))



# [1.1.0](https://github.com/elysia-best/apm-app-store/compare/v1.1.0-beta.1...v1.1.0) (2026-02-14)


### Bug Fixes

* **app:** floor download progress percentage ([ed92145](https://github.com/elysia-best/apm-app-store/commit/ed92145f9145b9190858e1cf4c2a722efe0e2ff0))



# [1.1.0-beta.1](https://github.com/elysia-best/apm-app-store/compare/v1.0.4...v1.1.0-beta.1) (2026-02-14)


### Bug Fixes

* 修复应用还没有安装完，按钮就重新变成可安装状态 ([#11](https://github.com/elysia-best/apm-app-store/issues/11)) ([b43c611](https://github.com/elysia-best/apm-app-store/commit/b43c6117ecb1ec12f590667dfad7db13263d9d68))


### Features

* 更新类型系统指南，添加代码检查和格式化要求 ([10808c8](https://github.com/elysia-best/apm-app-store/commit/10808c8f3b2f5535c7dfca6fc8a1e7a45cb5b95c))
* 更新搜索逻辑 ([d5266c6](https://github.com/elysia-best/apm-app-store/commit/d5266c6af81eb6aa28e2f376c88affbea227a5f7))
* 添加 ESLint 配置并优化代码风格，移除未使用的功能 ([e11740a](https://github.com/elysia-best/apm-app-store/commit/e11740ad4cff877d93e409bc8adb28f15717e97e))
* **app:** add cache buster for API requests ([9f50e25](https://github.com/elysia-best/apm-app-store/commit/9f50e25dc09cc0bf1d8e68cefb6843aa9bd8b7e6)), closes [#16](https://github.com/elysia-best/apm-app-store/issues/16)
* **app:** add download count display ([a3f18bb](https://github.com/elysia-best/apm-app-store/commit/a3f18bb593a8b3b1da9927582eb9f6fb5ef18e24))
* **docs:** 添加 AI 编码指导文档以概述项目架构和核心概念 ([c3ae477](https://github.com/elysia-best/apm-app-store/commit/c3ae4774976bd0464ca8d500792f4865f0b589e9))
* **install:** add metalink download support and progress tracking ([74c4eb4](https://github.com/elysia-best/apm-app-store/commit/74c4eb4fbc7dd0d91bbbfac2b91bbb2bf1fa0b68)), closes [#12](https://github.com/elysia-best/apm-app-store/issues/12)
* support download statistics ([5ac9376](https://github.com/elysia-best/apm-app-store/commit/5ac9376200e54e331d22564424db4c41564d23d3)), closes [#15](https://github.com/elysia-best/apm-app-store/issues/15)
* **theme:** add system theme support ([7aeb3d5](https://github.com/elysia-best/apm-app-store/commit/7aeb3d5dd4d53ce6a6fed03957ee6f5d9eee0f39)), closes [#13](https://github.com/elysia-best/apm-app-store/issues/13)



## [1.0.4](https://github.com/elysia-best/apm-app-store/compare/v1.0.4-beta.1...v1.0.4) (2026-01-31)



## [1.0.4-beta.1](https://github.com/elysia-best/apm-app-store/compare/v1.0.4-beta.0...v1.0.4-beta.1) (2026-01-31)


### Bug Fixes

* 修复应用启动命令，移除交互式模式 ([2f7af3c](https://github.com/elysia-best/apm-app-store/commit/2f7af3ca8f704ae0ae9aba572f3f451c7d5a701c))


### Features

* 添加 host-spawn 下载步骤并更新应用启动命令 ([850b8dc](https://github.com/elysia-best/apm-app-store/commit/850b8dcd1ff9789960dca38527cfa03008fa8c89))



## [1.0.4-beta.0](https://github.com/elysia-best/apm-app-store/compare/v1.0.3...v1.0.4-beta.0) (2026-01-31)


### Features

* 添加重复任务检查，避免重复下载任务 ([0d1d4e5](https://github.com/elysia-best/apm-app-store/commit/0d1d4e567940366c5754f4dcdb83213f8fe87d7d))
* 现在仅在有任务时才会到托盘 ([92d1573](https://github.com/elysia-best/apm-app-store/commit/92d1573cf082402b7f44a6beedbc47f58dc91781))
* enhance install manager to prevent duplicate package installations and improve app launching command ([eeefe52](https://github.com/elysia-best/apm-app-store/commit/eeefe5295b8698b887afad467c8151add6e4e8f5))



## [1.0.3](https://github.com/elysia-best/apm-app-store/compare/v1.0.3-beta.1...v1.0.3) (2026-01-31)


### Bug Fixes

* deep link handling at electron startup ([0ed7f64](https://github.com/elysia-best/apm-app-store/commit/0ed7f64a218e0a26b384810b1a0ac8ae314c2501))


### Features

* add app launching functionality and update related components ([6154d75](https://github.com/elysia-best/apm-app-store/commit/6154d75fa6893825e74f7bc421fa91eef0fc4f3f))
* enhance application type definitions and improve app management logic ([39e40ff](https://github.com/elysia-best/apm-app-store/commit/39e40ff946911c82190c7f0158b5bab9287ac3e4))
* update application icons and implement tray functionality ([f89b9eb](https://github.com/elysia-best/apm-app-store/commit/f89b9ebfd9ba75fef675d063bf8632143fd125d4))
* update application name and paths to reflect new branding ([641589f](https://github.com/elysia-best/apm-app-store/commit/641589f8754b638a7f53c729a2930f33884cd51e))



## [1.0.3-beta.1](https://github.com/elysia-best/apm-app-store/compare/v1.0.2...v1.0.3-beta.1) (2026-01-31)


### Bug Fixes

* 修复确认卸载界面应用名称显示 ([b4ef653](https://github.com/elysia-best/apm-app-store/commit/b4ef6532997fdfeb950af16edfa718d1c19507f5))
* 修复卸载请求中的应用名称查找逻辑 ([9799718](https://github.com/elysia-best/apm-app-store/commit/97997182bc2bf7b8d3a34f062deadfd910987b09))
* **build:** add bash shell to build release files ([354eea3](https://github.com/elysia-best/apm-app-store/commit/354eea36267f0284381521ee401d15256ecf8151))


### Features

* 更新安装按钮状态反馈，添加安装队列提示 ([4ce097b](https://github.com/elysia-best/apm-app-store/commit/4ce097bae032601572112d4647f6374875ca9719))
* 更新版本号至 1.0.3-beta.0 ([327ee54](https://github.com/elysia-best/apm-app-store/commit/327ee5400e1b967902734d381411a2cf239ddb16))
* 更新本地应用列表，区分依赖和用户安装的包 ([588eaf9](https://github.com/elysia-best/apm-app-store/commit/588eaf9746482d18716c4f929a3150b560aa5a62))
* 更新模态框样式，添加最大高度限制 ([61790a8](https://github.com/elysia-best/apm-app-store/commit/61790a85882b6c4ef3ac6b3d60de2f7a7d852025))
* 添加卸载确认模态框，支持卸载进度显示 ([b9325db](https://github.com/elysia-best/apm-app-store/commit/b9325db8b0d3e426d7f2e443069a4641aab7d581))
* **preload:** expose architecture detection to renderer process ([5b09dfb](https://github.com/elysia-best/apm-app-store/commit/5b09dfb3d985a0fd6dcd222e33312f957c330cd5))


### Performance Improvements

* 移除模态框背景模糊效果 ([eaa2868](https://github.com/elysia-best/apm-app-store/commit/eaa28686a36dd7c5942e227ba30e4ffae249fa2f))



## [1.0.2](https://github.com/elysia-best/apm-app-store/compare/9b17c57c5cb6ef6848fdc83f37d1b4d317e2b9a1...v1.0.2) (2026-01-30)


### Bug Fixes

* 更新构建依赖，添加构建工具支持 ([bc2f791](https://github.com/elysia-best/apm-app-store/commit/bc2f79114c700dc98426379703383873908f8f21))
* 更新构建依赖，添加python3支持 ([f8f163e](https://github.com/elysia-best/apm-app-store/commit/f8f163e3b87ea0dae7e3af0645ae4620c468479b))
* 更新构建依赖，移除不必要的包并优化安装命令 ([1c791cd](https://github.com/elysia-best/apm-app-store/commit/1c791cd3c83ebc51db8348c6ebce8b4d4eff42d9))
* 更新上传工件路径以支持不同包类型 ([9ee8339](https://github.com/elysia-best/apm-app-store/commit/9ee8339577ee93f5c7c47be119a6275379321bfe))
* 更新应用图标格式为ICNS，优化安装管理器命令执行 ([4b49424](https://github.com/elysia-best/apm-app-store/commit/4b49424105451eceb6653fd2974fad7021a4b2cd))
* 更新应用ID和版本信息，修复许可证类型 ([a3d50e0](https://github.com/elysia-best/apm-app-store/commit/a3d50e026aa570cd2a49da0acd604f4db682bd72))
* 更新vite版本至6.4.1 ([51ee401](https://github.com/elysia-best/apm-app-store/commit/51ee4019d969767f313cd8af23ea1f0e310b3f4b))
* 将依赖项'apm'更改为'amber-package-manager' ([f7eedcd](https://github.com/elysia-best/apm-app-store/commit/f7eedcd4fd3a073dd1b2c5623c9fe12bb43b43a1))


### Features

*  统一安装和卸载脚本以支持PolicyKit权限配置 ([f15fb28](https://github.com/elysia-best/apm-app-store/commit/f15fb28d80c481a40d768c12cb5f28a4daa6a5a6))
* 更新窗口标题和尺寸，优化按钮样式 ([185b498](https://github.com/elysia-best/apm-app-store/commit/185b4984c60a3b5049d44d8e8dc4ff45384b9000))
* 更新TODO列表，添加应用更新和显示已安装应用功能 ([402ba1f](https://github.com/elysia-best/apm-app-store/commit/402ba1fb00d81828f6c228fb1012203861629fab))
* 添加对deb和rpm包的构建支持，更新构建依赖和版本信息 ([640e0bd](https://github.com/elysia-best/apm-app-store/commit/640e0bd69df90e278803a14e30aa50c99123db95))
* 添加已安装应用和可更新应用的管理功能，支持卸载和升级操作 ([ea0261a](https://github.com/elysia-best/apm-app-store/commit/ea0261a1923fbc692ab0480374f7232759446dc7))
* 添加deb和rpm包的依赖项配置 ([847bcc7](https://github.com/elysia-best/apm-app-store/commit/847bcc7885708a3a2c83f78a951ac3608fc6356c))
* 添加electron-builder.yml配置文件并更新构建脚本 ([38a4d45](https://github.com/elysia-best/apm-app-store/commit/38a4d4512f3c634e923192f01bbcbd2cc0687634))
* 添加PolicyKit权限配置和安装/卸载脚本 ([071aa36](https://github.com/elysia-best/apm-app-store/commit/071aa36fb417478d79db0f0e62aebefe573a699a))
* **deeplink:** implement custom deep link handling and remove electron-app-universal-protocol-client ([c7b3257](https://github.com/elysia-best/apm-app-store/commit/c7b3257a2cefade75a6bc5a82313b38d9acc5d06))
* **download:** 支持重试下载功能并更新相关逻辑 ([bdf51a1](https://github.com/elysia-best/apm-app-store/commit/bdf51a1037822d117a84a1b2914d6c3c39387d57))
* **install:** 实现安装管理器，支持安装、检查已安装状态和初步卸载功能 ([bf93059](https://github.com/elysia-best/apm-app-store/commit/bf93059da177c2403c2c6f5b31b8855220d032b2))
* **install:** add app uninstall functionality ([ac0dc22](https://github.com/elysia-best/apm-app-store/commit/ac0dc225bcd8e202489a0b733449a3d8071a4a60))
* **install:** added basis install process ([50fb1a0](https://github.com/elysia-best/apm-app-store/commit/50fb1a00658119191a35e98413c13b39d5e5699e))
* overhaul application to APM 应用商店 with enhanced download management ([9b17c57](https://github.com/elysia-best/apm-app-store/commit/9b17c57c5cb6ef6848fdc83f37d1b4d317e2b9a1))




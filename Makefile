#!/usr/bin/make -f

# Makefile for APM Store Electron App
# 使用方法:
#   make pack-linux    # 打包 Linux x64 版本
#   make pack-all      # 打包所有架构
#   make clean         # 清理输出目录
#   make help          # 查看帮助

# ==================== 配置变量 ====================
APP_NAME      := apm-store
APP_SRC       := .
OUT_DIR       := release
ELECTRON_VER  := $(shell node -p "require('./package.json').devDependencies.electron" 2>/dev/null || echo "latest")

# 资源路径
ICON_LINUX    := icons/amber-pm-logo.png
# This is for electron, will be installed to <APPDIR>/resources/extras. Used install-extra-resource target instead of this!
EXTRA_RES     := ""

# 颜色输出（可选，提升可读性）
BLUE := \033[0;34m
NC   := \033[0m

# Architecture map for dpkg 
# "Arch in uname -m" -> "Arch in electron"
# See: https://wiki.debian.org/SupportedArchitectures and https://www.debian.org/ports/
# Note: armel will be removed in Debian 14
x86_64_mapped   := x64
aarch64_mapped  := arm64
loongarch64_mapped := loong64

# Get arch value, return original value if not found
get_mapped_arch = $(if $(value $(1)_mapped),$(value $(1)_mapped),$(1))

SYSTEM_ARCH := $(shell uname -m)

ELECTRON_PACKAGER_ARCH_NATIVE := $(call get_mapped_arch,$(SYSTEM_ARCH))
ELECTRON_PACKAGER_ARCH = $(if $(CUSTOM_ARCH),$(CUSTOM_ARCH),$(ELECTRON_PACKAGER_ARCH_NATIVE))

DIST_DIR := $(OUT_DIR)/$(APP_NAME)-linux-$(ELECTRON_PACKAGER_ARCH)

# ==================== 默认目标 ====================
.PHONY: all
all: pack-linux-native

# ==================== 打包目标 ====================
.PHONY: build-vite
build-vite:
	@echo "$(BLUE)[BUILD]$(NC) Building renderer with Vite..."
	npm run build:vite

.PHONY: pack-linux-native
pack-linux-native: check-deps build-vite
	@echo "$(BLUE)[PACK]$(NC) Building $(APP_NAME) for Linux $(ELECTRON_PACKAGER_ARCH)..."
	npx electron-packager $(APP_SRC) $(APP_NAME) \
		--platform=linux \
		--arch=$(ELECTRON_PACKAGER_ARCH) \
		--asar \
		--out=$(OUT_DIR) \
		--executable-name=$(APP_NAME) \
		--icon=$(ICON_LINUX) \
		--prune \
		$(foreach res,$(EXTRA_RES),--extra-resource=$(res))
	@echo "$(BLUE)[DONE]$(NC) Output: $(OUT_DIR)/$(APP_NAME)-linux-$(ELECTRON_PACKAGER_ARCH)"

# ==================== 安装目标 ====================
install_extra_resource:
	@echo "$(BLUE)[INSTALL]$(NC) Copying extra resources to $(DESTDIR)/opt/$(APP_NAME)/resources/extras"
	mkdir -p $(DESTDIR)/opt/$(APP_NAME)/resources/
	cp -rv extras/shell-helper $(DESTDIR)/opt/$(APP_NAME)/resources/shell-helper
	cp -rv icons $(DESTDIR)/opt/$(APP_NAME)/resources/icons

.PHONY: install
install: install_extra_resource
	@echo "$(BLUE)[INSTALL]$(NC) Installing $(APP_NAME) to DESTDIR"
	mkdir -p $(DESTDIR)/opt/$(APP_NAME)
	rsync -av $(DIST_DIR)/. $(DESTDIR)/opt/$(APP_NAME)/
	rsync -av packaging/common/. $(DESTDIR)/
# ==================== 辅助目标 ====================
.PHONY: clean
clean:
	@echo "$(BLUE)[CLEAN]$(NC) Removing $(OUT_DIR)..."
	rm -rf $(OUT_DIR)

.PHONY: check-deps
check-deps:
	@command -v node >/dev/null 2>&1 || { echo "❌ node is not installed"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "❌ npm is not installed"; exit 1; }
	@test -f package.json || { echo "❌ package.json not found in $(APP_SRC)"; exit 1; }
	@echo "$(BLUE)[OK]$(NC) Dependencies checked"

generate-debian-changelog:
	@echo "$(BLUE)[CHANGELOG]$(NC) Generating debian/changelog from git history..."
	@bash packaging/deb/generate-changelog.sh >> packaging/deb/debian/changelog

.PHONY: help
help:
	@echo "Available targets:"
	@echo "  pack-linux-native  - Build Linux x64 version (default)"
	@echo "  clean              - Clean output directory"
	@echo "  install            - Install to DESTDIR (auto executes pack-linux-native)"
	@echo "  help               - Show this help message"
	@echo "Cross compilation:"
	@echo "  To build for a different architecture, set CUSTOM_ARCH environment variable:"
	@echo "    make pack-linux-native CUSTOM_ARCH=arm64"

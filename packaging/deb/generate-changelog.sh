#!/usr/bin/env bash
#
# generate-debian-changelog.sh
# Automatically generate a debian/changelog entry from git commits between tags
# Version is extracted from package.json
#

set -euo pipefail

# ==================== 配置区域 ====================
PACKAGE_NAME="${DEB_PACKAGE_NAME:-apm-store}"
DISTRIBUTION="${DEB_DISTRIBUTION:-unstable}"
URGENCY="${DEB_URGENCY:-medium}"
PACKAGE_JSON="${PACKAGE_JSON:-package.json}"
AUTO_MAINTAINER="${AUTO_MAINTAINER:-true}"

# ==================== 辅助函数 ====================

get_package_version() {
    if [[ ! -f "$PACKAGE_JSON" ]]; then
        echo "❌ Error: $PACKAGE_JSON not found" >&2
        exit 1
    fi
    if command -v node &>/dev/null; then
        node -p "require('$PACKAGE_JSON').version" 2>/dev/null || \
        grep -m1 '"version"' "$PACKAGE_JSON" | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/'
    elif command -v jq &>/dev/null; then
        jq -r '.version' "$PACKAGE_JSON"
    else
        grep -m1 '"version"' "$PACKAGE_JSON" | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/'
    fi
}

get_sorted_tags() {
    git tag -l --sort=-v:refname 2>/dev/null | grep -E '^v?[0-9]+\.[0-9]+' || true
}

get_previous_tag() {
    local latest_tag="$1"
    git describe --tags --abbrev=0 "$latest_tag^" 2>/dev/null || true
}

format_rfc2822_date() {
    date -R
}

get_maintainer() {
    if [[ "$AUTO_MAINTAINER" == "true" ]]; then
        local name email
        name=$(git config user.name 2>/dev/null || echo "Unknown")
        email=$(git config user.email 2>/dev/null || echo "unknown@example.com")
        echo "$name <$email>"
    else
        echo "${DEB_MAINTAINER:-APM Store Maintainer <maintainer@apm-store.example.com>}"
    fi
}

format_commit_entry() {
    local commit_msg="$1"
    local first_line rest
    
    first_line=$(echo "$commit_msg" | head -n1 | sed 's/^[[:space:]]*//')
    rest=$(echo "$commit_msg" | tail -n +2 | sed 's/^[[:space:]]*/  /' | sed '/^[[:space:]]*$/d')
    
    echo "  * $first_line"
    if [[ -n "$rest" ]]; then
        echo "$rest"
    fi
}

# ✅ 修复：使用 grep -P 支持 PCRE，或降级为兼容 grep -E 的正则
extract_closes_bugs() {
    local commit_msg="$1"
    
    # 方案 1: 优先使用 grep -P (PCRE，支持完整语法)
    if grep -P "" /dev/null 2>/dev/null; then
        echo "$commit_msg" | grep -oiP 'closes:\s*(bug)?#?\s?\d+(?:,\s*(bug)?#?\s?\d+)*' | \
            sed 's/[[:space:]]//g' | tr '[:upper:]' '[:lower:]' || true
    else
        # 方案 2: 降级为 grep -E 兼容语法 (去掉 ?: 非捕获组)
        echo "$commit_msg" | grep -oiE 'closes:[[:space:]]*(bug)?#?[[:space:]]?[0-9]+(,[[:space:]]*(bug)?#?[[:space:]]?[0-9]+)*' | \
            sed 's/[[:space:]]//g' | tr '[:upper:]' '[:lower:]' || true
    fi
}

# ==================== 主逻辑 ====================

main() {
    local version
    version=$(get_package_version)
    if [[ -z "$version" ]]; then
        echo "❌ Error: Could not extract version from $PACKAGE_JSON" >&2
        exit 1
    fi
    # echo "📦 Package: $PACKAGE_NAME" >&2
    # echo "🔖 Version: $version" >&2

    local latest_tag prev_tag
    latest_tag=$(get_sorted_tags | head -n1)
    
    if [[ -z "$latest_tag" ]]; then
        echo "⚠️  No git tags found. Using initial commit as base." >&2
        prev_tag=""
    else
        prev_tag=$(get_previous_tag "$latest_tag")
        # echo "🏷️  Latest tag: ${latest_tag:-<none>}" >&2
        # echo "🏷️  Previous tag: ${prev_tag:-<initial commit>}" >&2
    fi

    local commit_range
    if [[ -n "$prev_tag" ]]; then
        commit_range="${prev_tag}..${latest_tag}"
    else
        commit_range=""
    fi

    local changes=""
    local all_closes=""
    
    if [[ -n "$commit_range" ]]; then
        while IFS= read -r commit_hash; do
            local msg
            msg=$(git log -1 --format=%B "$commit_hash")
            
            changes+=$(format_commit_entry "$msg")
            changes+=$'\n'
            
            local closes
            closes=$(extract_closes_bugs "$msg")
            if [[ -n "$closes" ]]; then
                all_closes+="$closes "
            fi
        done < <(git log --reverse --pretty=format:%H $commit_range 2>/dev/null)
    else
        while IFS= read -r commit_hash; do
            local msg
            msg=$(git log -1 --format=%B "$commit_hash")
            changes+=$(format_commit_entry "$msg")
            changes+=$'\n'
        done < <(git log --reverse --pretty=format:%H -n 50 2>/dev/null)
    fi

    local closes_line=""
    if [[ -n "$all_closes" ]]; then
        local bugs
        bugs=$(echo "$all_closes" | grep -oE '#[0-9]+' | sort -u -t# -k2 -n | tr '\n' ',' | sed 's/,$//')
        if [[ -n "$bugs" ]]; then
            closes_line="Closes: $bugs"
        fi
    fi

    local maintainer date_rfc2822
    maintainer=$(get_maintainer)
    date_rfc2822=$(format_rfc2822_date)

    echo "${PACKAGE_NAME} (${version}) ${DISTRIBUTION}; urgency=${URGENCY}"
    echo ""
    
    if [[ -n "$closes_line" ]]; then
        echo "  * ${closes_line}"
        echo ""
    fi
    
    if [[ -n "$changes" ]]; then
        echo -n "$changes"
    else
        echo "  * Initial release"
    fi
    
    echo ""
    echo " -- ${maintainer}  ${date_rfc2822}"
}

main "$@"
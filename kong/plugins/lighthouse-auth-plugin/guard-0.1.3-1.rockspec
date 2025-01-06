package = "guard"

-- The version '0.1.1' is the source code version, the trailing '1' is the version of this rockspec.
-- whenever the source version changes, the rockspec should be reset to 1. The rockspec version is only
-- updated (incremented) when this file changes, but the source remains the same.

version = "0.1.3-1"

supported_platforms = {"linux", "macosx"}

source = {
  url = "https://github.com/lighthouse-web3/lighthouse-auth-plugin.git",
  tag = "0.1.3"
}

description = {
  summary = "",
  license = "MIT"
}

dependencies = {
}

build = {
  type = "builtin",
  modules = {
    ["kong.plugins.guard.handler"] = "src/handler.lua",
    ["kong.plugins.guard.schema"] = "src/schema.lua",
  }
}

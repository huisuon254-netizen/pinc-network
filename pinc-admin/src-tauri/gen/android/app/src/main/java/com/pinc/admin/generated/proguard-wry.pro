# THIS FILE IS AUTO-GENERATED. DO NOT MODIFY!!

# Copyright 2020-2023 Tauri Programme within The Commons Conservancy
# SPDX-License-Identifier: Apache-2.0
# SPDX-License-Identifier: MIT

-keep class com.pinc.admin.* {
  native <methods>;
}

-keep class com.pinc.admin.WryActivity {
  public <init>(...);

  void setWebView(com.pinc.admin.RustWebView);
  java.lang.Class getAppClass(...);
  int getId();
  java.lang.String getVersion();
  int startActivity(...);
}

-keep class com.pinc.admin.Ipc {
  public <init>(...);

  @android.webkit.JavascriptInterface public <methods>;
}

-keep class com.pinc.admin.RustWebView {
  public <init>(...);

  void loadUrlMainThread(...);
  void loadHTMLMainThread(...);
  void evalScript(...);
}

-keep class com.pinc.admin.RustWebChromeClient,com.pinc.admin.RustWebViewClient {
  public <init>(...);
}

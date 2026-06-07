# 小深 Android App 构建修复指南

## 问题：Gradle 版本不匹配

Android Studio 报错 `com.android.tools.build:gradle:8.2.0 is not available`

## 修复步骤

在 Android Studio 中，左侧项目面板找到并修改以下文件：

### 1. `gradle/wrapper/gradle-wrapper.properties`

修改 `distributionUrl`：
```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.9-all.zip
```

### 2. `build.gradle`（项目根目录，不是 app 里的）

修改：
```gradle
dependencies {
    classpath 'com.android.tools.build:gradle:8.7.3'
}
```

### 3. 在 Android Studio 顶部点「Sync Now」

### 4. 如果还报 SDK 缺失，打开 SDK Manager

Tools → SDK Manager → SDK Platforms → 勾选 Android 14 (API 34) → Apply

## 完整步骤

1. 修改两个 Gradle 文件
2. 点 Sync Now
3. Build → Build APK

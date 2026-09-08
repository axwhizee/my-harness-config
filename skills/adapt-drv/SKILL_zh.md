---
name: adapt-drv
description: 面向嵌入式的模块驱动库分层设计规范。当需要为新的外设模块（LCD、传感器等）设计驱动库时使用
metadata:
  author: Axwhizee
  version: 7.6
---

# 抽象驱动与可适配可移植方法 (Abstraction Driver with Adaptable Portable Technique)

> 本文中所有`xxx`均指代模块的型号名，当涉及 API 函数命名时，允许对完整型号名进行简写或取别称作为前缀，前提是遵循**清晰、简洁、无歧义**的原则

## 核心原则

### 软硬分离

- **核心层(Core)**：实现协议逻辑、算法、资源等应用逻辑。不得直接包含平台相关的 HAL/LL 头文件，所有平台相关操作通过移植层抽象
- **移植层(Portable)**：实现通信传输、引脚控制等工具接口。是唯一包含平台头文件的部分

### 调用简单

调用者只需 `#include "xxx.h"` 即可访问所有公共 API

### 依赖清晰

依赖顺序：应用层（用户代码） -> 核心层（APIs + 辅助工具） -> 移植层 -> 平台驱动。避免反向依赖

### 快速移植

移植不同平台时，只需实现 `port/xxx_port.h` 中声明的所有接口函数，根据目标平台调整相关宏定义，并修改 `xxx_config.h` 中的参数即可

### 规范化

API 函数采用 snake_case 风格，举例：

```c
xxx_err_t xxx_init(xxx_handle_t *handle);
xxx_err_t xxx_read_reg(xxx_handle_t *handle, uint8_t reg, uint8_t *val);
void xxx_delay_ms(uint32_t ms);
```

### 多实例支持

使用句柄传递实例上下文，实例句柄由用户应用层创建并绑定平台资源，驱动库不负责。实例状态避免使用静态/全局变量

## 驱动库目录结构

```bash
xxx_Driver/
├── internal/             // 核心层内部辅助，不对外暴露
│   ├── xxx_utils.h(.c)   // 辅助 API 的实现，避免 xxx.c 过于臃肿
│   └── ...
├── port/                 // 移植层，唯一包含平台 HAL 的部分
│   ├── xxx_port.h(.c)    // 移植时只需实现其中的内容
│   └── ...
├── xxx_config.h          // 驱动库公共配置，如宏开关、参数范围、编码公式
├── xxx_types.h           // 公共类型定义，如错误码、句柄
├── xxx.h/.c              // 核心层 API，面向应用层的唯一接口
└── README.md             // 模块介绍、驱动库 API 文档等
```

> **本文所有示例代码均不构成模板，具体移植代码应当按实际需求编写**

### `xxx_config.h`

位于根目录，储存模块的配置信息，核心层和移植层均可见，移植时根据实际情况调整

```c
// xxx_config.h
#pragma once

#define xxx_UART_BAUD   115200
#define xxx_CMD_HEAD    0xFF  // 需要注释配置说明
#define xxx_TIMEOUT_MS  1000
#define xxx_RTOS_ADPT   1     // 控制是否启动RTOS适配
// ...
```

### `xxx_types.h`

储存模块公共类型定义，包括但不限于错误码、API 涉及数据结构、句柄等。核心层、移植层、应用层均可调用

```c
// xxx_types.h
#pragma once
#include <stdint.h>
#include <stdbool.h>
// ...

// 公共 API 需要添加 C++ 保护
#ifdef __cplusplus
extern "C" {
#endif

// 错误码
typedef enum {
    xxx_OK = 0U,
    xxx_ERR_PARAM,
    xxx_ERR_TIMEOUT,
    // ...
} xxx_err_t;

// 状态机，主要面向复杂驱动
typedef enum {
    xxx_STATE_UNINIT = 0U,
    xxx_STATE_INITIALIZED,
    // ...
} xxx_state_t;

// 平台资源绑定
typedef struct {
  void *uart;
  void *gpio_port;
  uint16_t gpio_pin;
} xxx_port_t;

// 实例句柄
typedef struct {
    const xxx_port_t *port;
    // void *mutex;  // 若需要库内互斥则启用
    xxx_state_t state;
    // ...
} xxx_handle_t;

// ...

#ifdef __cplusplus
}
#endif
```

### `xxx.h(.c)`

面向应用层的 API 实现，用户只需 `#include "xxx.h"` 即可访问驱动库所有 API，不包含任何平台HAL

```c
// xxx.h
#pragma once
#include "xxx_types.h"
// ...

#ifdef __cplusplus
extern "C" {
#endif

/* 声明所有公共 API 函数，并添加 doxygen 注释，尤其指明 API 的参数和返回，便于用户调用 */

/**
 * @brief xxx 初始化
 * @param hxxx xxx 实例句柄
 * @return xxx_err_t
 */
xxx_err_t xxx_init(xxx_handle_t *hxxx);

// ...

#ifdef __cplusplus
}
#endif
```

```c
// xxx.c
#include "xxx.h"
#include "xxx_config.h"
#include "internal/xxx_utils.h"   // 以库根目录为基准，避免 `../`
#include "port/xxx_port.h"
// ...

/* 实现 xxx.h 中声明的全部 API 函数 */

xxx_err_t xxx_init(xxx_handle_t *hxxx) {
  if (!hxxx || !hxxx->port) return xxx_ERR_PARAM;
  if (hxxx->state != xxx_STATE_UNINIT) return xxx_OK;
  xxx_err_t err = xxx_port_init(hxxx);
  if (err) return err;
  // ...
  hxxx->state = xxx_STATE_INITIALIZED;
  return xxx_OK;
}

// ...
```

### `internal/*`

包含内部辅助工具函数、子模块、资源文件等，按 `xxx_xxxx.h/.c` 格式命名。这些文件**不对外暴露**，仅由 `xxx.c` 内部调用

### `port/xxx_port.h(.c)`

作为核心层与HAL层之间的翻译，是唯一允许包含平台 HAL 库的部分，根据目标平台编写。核心层可见

```c
// xxx_port.h
#pragma once
#include "xxx_types.h"
// ...

#ifdef __cplusplus
extern "C" {
#endif

/* 不应在此包含任何平台 HAL，移步`xxx_port.c` */

/* 声明所有公共 API 函数，并添加 doxygen 注释，尤其指明 API 的参数和返回，便于用户实现 */

/**
 * @brief xxx 外设初始化
 * @param hxxx 实例句柄
 * @return xxx_err_t
 */
xxx_err_t xxx_port_init(xxx_handle_t *hxxx);
/**
 * @note 接口的实现应当充分考虑到诸如移植 RTOS 等情况下的兼容性
 * @param ms 延迟时间
 */
void xxx_delay_ms(uint32_t ms);

// ...

#ifdef __cplusplus
}
#endif
```

```c
// xxx_port.c
#include "xxx_port.h"
#include "xxx_config.h"
#include "stm32xxx_hal.h"   // 驱动库中唯一可包含 HAL 的地方
// ...

xxx_err_t xxx_port_init(xxx_handle_t *hxxx) { /* ... */ }   // port 等应当注意将 HAL 错误翻译为库错误码
void xxx_delay_ms(uint32_t ms) {
#if xxx_RTOS_ADPT == 1
  osDelay(ms);  // CMSIS-RTOS
#else
  HAL_Delay(ms);
#endif
}

// ...
```

### `README.md`

这份文档的目的在于，让用户能够建立对模块的完整认识，并且明确如何移植本驱动库，从而方便使用该模块。因此本文档编写应当以用户视角的清晰、可复现为原则

```markdown
# xxx 驱动库

## 概述

### xxx 简介

（xxx 模块的功能、原理、选型等）

### 使用说明

（电气特性、接线、配置等信息）

### 目录结构

（驱动库的结构）

## API 参考

（公共 API 的完整列表与介绍，包括函数与数据类型等，并给出调用案例）

## 移植指南

（移植层所需工作介绍与注意事项）

## 故障排除

（已知与潜在问题、局限的解决方案）
```

## 调用示例

```c
// 应用层
#include "xxx.h"
#include "uart.h"

UART_HandleTypeDef huartx;
static const xxx_port_t xxx_port = {
  .bus = &huartx,
  .gpio_port = GPIOX,
  .gpio_pin = GPIO_Pin,
  // ...
};
xxx_handle_t hxxx = {
  .port = &xxx_port
};

int main(void) {
  // ...

  xxx_err_t err = xxx_init(&hxxx);
  if (err) logError("xxx Initialize FAIL: %u", err);
  else logInfo("xxx initialize SUCCESS!");

  // ...
}
```

## 附加建议

- API返回值规范：更推荐将错误码作为函数返回值，数据通过指针参数输出
- const正确性：所有不修改句柄内容的 API 均采用`const xxx_handle_t *hxxx`

## 灵活调整

本 Skill 只提供基本设计原则，若实际开发中如遇问题，应与用户协商灵活调整

---
name: adapt-drv
description: Layered design specification for embedded module driver libraries. Use this when designing driver libraries for new peripheral modules (e.g., LCDs, sensors, etc.).
metadata:
  author: Axwhizee
  version: 7.5
---

# Abstraction Driver with Adaptable Portable Technique

> In this document, all instances of `xxx` refer to the module's model name. When naming API functions, abbreviations or aliases of the full model name are allowed as prefixes, provided they follow the principles of being **clear, concise, and unambiguous**.

## Core Principles

### Hardware-Software Separation

- **Core Layer**: Implements protocol logic, algorithms, resources, and other application logic. Must not directly include platform-specific HAL/LL header files; all platform-specific operations are abstracted through the portable layer.
- **Portable Layer**: Implements utility interfaces such as communication transmission and pin control. This is the only part that includes platform header files.

### Simple Invocation

Callers only need to `#include "xxx.h"` to access all public APIs.

### Clear Dependencies

Dependency order: Application Layer (user code) -> Core Layer (APIs + utility tools) -> Portable Layer -> Platform Drivers. Avoid reverse dependencies.

### Rapid Porting

When porting to different platforms, you only need to implement all interface functions declared in `port/xxx_port.h`, adjust relevant macro definitions according to the target platform, and modify parameters in `xxx_config.h`.

### Standardization

API functions use the `snake_case` style. Examples:

```c
xxx_err_t xxx_init(xxx_handle_t *handle);
xxx_err_t xxx_read_reg(xxx_handle_t *handle, uint8_t reg, uint8_t *val);
void xxx_delay_ms(uint32_t ms);
```

### Multi-Instance Support

Use handles to pass instance contexts. Instance handles are created by the user application layer and bound to platform resources; the driver library is not responsible for resource allocation. Avoid using static/global variables for instance state.

## Driver Library Directory Structure

```bash
xxx_Driver/
├── internal/             // Core layer internal utilities, not exposed externally
│   ├── xxx_utils.h(.c)   // Implementation of helper APIs to prevent xxx.c from becoming too bloated
│   └── ...
├── port/                 // Portable layer, the only part containing platform HAL
│   ├── xxx_port.h(.c)    // Only the contents here need to be implemented during porting
│   └── ...
├── xxx_config.h          // Driver library public configurations, such as macro switches, parameter ranges, encoding formulas
├── xxx_types.h           // Public type definitions, such as error codes, handles
├── xxx.h/.c              // Core layer APIs, the only interface facing the application layer
└── README.md             // Module introduction, driver library API documentation, etc.
```

> **All example code in this document does not constitute a strict template; specific porting code should be written according to actual requirements.**

### `xxx_config.h`

Located in the root directory, stores module configuration information. Visible to both the core and portable layers. Adjust according to actual conditions during porting.

```c
// xxx_config.h
#pragma once

#define xxx_UART_BAUD   115200
#define xxx_CMD_HEAD    0xFF  // Configuration description comments required
#define xxx_TIMEOUT_MS  1000
#define xxx_RTOS_ADPT   1     // Controls whether to enable RTOS adaptation
// ...
```

### `xxx_types.h`

Stores module public type definitions, including but not limited to error codes, API-related data structures, handles, etc. Callable by the core, portable, and application layers.

```c
// xxx_types.h
#pragma once
#include <stdint.h>
#include <stdbool.h>
// ...

// C++ guards required for public APIs
#ifdef __cplusplus
extern "C" {
#endif

// Error codes
typedef enum {
    xxx_OK = 0U,
    xxx_ERR_PARAM,
    xxx_ERR_TIMEOUT,
    // ...
} xxx_err_t;

// State machine, mainly for complex drivers
typedef enum {
    xxx_STATE_UNINIT = 0U,
    xxx_STATE_INITIALIZED,
    // ...
} xxx_state_t;

// Platform resource binding
typedef struct {
  void *uart;
  void *gpio_port;
  uint16_t gpio_pin;
} xxx_port_t;

// Instance handle
typedef struct {
    const xxx_port_t *port;
    // void *mutex;  // Enable if intra-library mutual exclusion is needed
    xxx_state_t state;
    // ...
} xxx_handle_t;

// ...

#ifdef __cplusplus
}
#endif
```

### `xxx.h(.c)`

API implementation facing the application layer. Users only need to `#include "xxx.h"` to access all APIs of the driver library. Does not include any platform HAL.

```c
// xxx.h
#pragma once
#include "xxx_types.h"
// ...

#ifdef __cplusplus
extern "C" {
#endif

/* Declare all public API functions and add Doxygen comments, specifically indicating API parameters and returns for user invocation */

/**
 * @brief xxx initialization
 * @param hxxx xxx instance handle
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
#include "internal/xxx_utils.h"   // Relative to library root directory, avoid `../`
#include "port/xxx_port.h"
// ...

/* Implement all API functions declared in xxx.h */

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

Contains internal utility functions, sub-modules, resource files, etc., named in the format `xxx_xxxx.h/.c`. These files are **not exposed externally** and are only called internally by `xxx.c`.

### `port/xxx_port.h(.c)`

Acts as a translator between the core layer and the HAL layer. It is the only part allowed to include platform HAL libraries and is written according to the target platform. Visible to the core layer.

```c
// xxx_port.h
#pragma once
#include "xxx_types.h"
// ...

#ifdef __cplusplus
extern "C" {
#endif

/* Do not include any platform HAL here; move to xxx_port.c */

/* Declare all public API functions and add Doxygen comments, specifically indicating API parameters and returns for user implementation */

/**
 * @brief xxx peripheral initialization
 * @param hxxx Instance handle
 * @return xxx_err_t
 */
xxx_err_t xxx_port_init(xxx_handle_t *hxxx);
/**
 * @note The implementation of the interface should fully consider compatibility in scenarios such as porting to RTOS.
 * @param ms Delay time
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
#include "stm32xxx_hal.h"   // The only place in the driver library where HAL can be included
// ...

xxx_err_t xxx_port_init(xxx_handle_t *hxxx) { /* ... */ }   // Port functions must translate HAL errors into library error codes
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

The purpose of this document is to allow users to build a complete understanding of the module and clarify how to port this driver library, thereby facilitating the use of the module. Therefore, this document should be written from a user's perspective, prioritizing clarity and reproducibility.

```markdown
# xxx Driver Library

## Overview

### xxx Introduction

(Functions, principles, selection criteria of the xxx module, etc.)

### Usage Instructions

(Electrical characteristics, wiring, configuration information, etc.)

### Directory Structure

(Structure of the driver library)

## API Reference

(Complete list and introduction of public APIs, including functions and data types, with invocation examples)

## Porting Guide

(Introduction to work required for the portable layer and precautions)

## Troubleshooting

(Solutions for known and potential issues and limitations)
```

## Invocation Example

```c
// Application Layer
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

## Additional Suggestions

- **API Return Value Convention**: It is highly recommended to use error codes as function return values and output data via pointer parameters.
- **const Correctness**: All APIs that do not modify the handle contents should use `const xxx_handle_t *hxxx`.

## Flexible Adjustment

This Skill only provides basic design principles. If problems are encountered during actual development, flexible adjustments should be negotiated with the user.

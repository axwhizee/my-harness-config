---
name: adapt-drv
description: Hierarchical design specification for embedded module driver libraries. Use when designing driver libraries for new peripheral modules (LCDs, sensors, etc.)
metadata:
  author: Axwhizee
  version: 8.6
---

# Abstraction Driver with Adaptable Portable Technique

> In this document, all instances of `xxx` refer to the module's model name. When naming API functions, abbreviations or aliases of the full model name are allowed as prefixes, provided they adhere to the principles of being **clear, concise, and unambiguous**.

## Core Principles

### Hardware-Software Separation

- **Core Layer**: Implements application logic such as protocol logic, algorithms, and resource management. It must not directly include any platform-specific HAL (Hardware Abstraction Layer). All platform-related operations are abstracted through the Porting Layer.
- **Porting Layer**: Implements porting interfaces for communication, timing, pin control, etc. It is the *only* part that includes platform-specific header files.

### Simple Invocation

Callers only need to `#include "xxx.h"` to access all public APIs.

### Clear Dependencies

Dependency order: Application Layer (user code) -> Core Layer (APIs + internal utilities) -> Porting Layer -> Platform HAL. Avoid reverse dependencies.

### Fast Porting

When porting to different platforms, one only needs to implement all interface functions declared in `port/xxx_port.h`, adjust relevant macros according to the target platform, and modify parameters in `xxx_config.h` as needed.

### Standardization

API functions use the `snake_case` naming convention. Examples:

```c
xxx_err_t xxx_init(xxx_handle_t *handle);
xxx_err_t xxx_read_reg(xxx_handle_t *handle, uint8_t reg, uint8_t *val);
void xxx_delay_ms(uint32_t ms);
```

### Multi-Instance Support

Use handles to pass instance contexts. Instance handles are created and bound to platform resources by the user's Application Layer; the driver library is not responsible for this. Avoid using static/global variables for instance states.

## Driver Library Directory Structure

```bash
xxx_Driver/
├── internal/             // Internal utilities for the Core Layer, not exposed externally
│   ├── xxx_utils.h(.c)   // Implementation of auxiliary APIs to prevent xxx.c from becoming bloated
│   └── ...
├── port/                 // Porting Layer, the only part that includes platform HAL
│   ├── xxx_port.h        // Declares internal APIs that need to be ported
│   ├── xxx_port_xxx.h    // Porting examples for different platforms
│   └── ...
├── xxx_config.h          // Public configurations for the driver library, such as macro switches, parameter ranges, encoding formulas
├── xxx_types.h           // Public type definitions, such as error codes, handles
├── xxx.h/.c              // Core Layer APIs, the sole interface facing the Application Layer
└── README.md             // Module introduction, driver library API documentation, etc.
```

> **All sample code in this document does not constitute a template; specific porting code should be written according to actual requirements.**

### `xxx_config.h`

Located in the root directory, it stores module configuration information. It is visible to both the Core Layer and the Porting Layer. Adjust it according to actual conditions during porting.

```c
// xxx_config.h
#pragma once

#define xxx_CMD_HEAD    0xFF  // Configuration description required
#define xxx_TIMEOUT_MS  1000
#define xxx_USE_RTOS    1     // RTOS feature toggle
// ...
```

### `xxx_types.h`

Stores public type definitions for the module, including but not limited to error codes, data structures involved in APIs, handles, etc. It can be accessed by the Core Layer, Porting Layer, and Application Layer.

```c
// xxx_types.h
#pragma once
#include <stdint.h>
#include <stdbool.h>
// ...

// C++ compatibility guards required for public APIs
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

// State machine, primarily for complex drivers
typedef enum {
    xxx_STATE_UNINIT = 0U,
    xxx_STATE_INITIALIZED,
    xxx_STATE_BUS_BUSY,
    // ...
} xxx_state_t;

// Handle, providing instantiation support
typedef struct {
    const void *i2c;  // Porting layer resources; Core Layer only passes them. The Application Layer and Porting Layer must align to avoid type errors.
    const void *gpiox;
    const uint8_t addr;
#if xxx_USE_RTOS
    void *mutex;  // RTOS concurrency protection
    void *event;  // RTOS semaphore/event handle
#endif
    const void *buffer;
    xxx_state_t state;
    // ...
} xxx_handle_t;

// ...

#ifdef __cplusplus
}
#endif
```

### `xxx.h(.c)`

API implementation facing the Application Layer. Users only need to `#include "xxx.h"` to access all driver library APIs. It must not contain any platform HAL.

```c
// xxx.h
#pragma once
#include "xxx_types.h"
// ...

#ifdef __cplusplus
extern "C" {
#endif

/* Declare all public API functions and add Doxygen comments, especially specifying parameters and return values for user convenience */

/**
 * @brief xxx initialization
 * @param hxxx xxx instance handle
 * @return xxx_err_t
 */
xxx_err_t xxx_init(xxx_handle_t *hxxx);
// De-initialization
xxx_err_t xxx_deinit(xxx_handle_t *hxxx);
/**
 * @brief Interrupt context-safe service function, may include event notification, called directly by the interrupt vector Handler
 * @note Requires lightweight, interrupt context-safe execution, does not handle flag clearing, and contains no HAL
 */
void xxx_urx_isr(xxx_handle_t *hxxx);
// ...

#ifdef __cplusplus
}
#endif
```

```c
// xxx.c
#include "xxx.h"
#include "xxx_config.h"
#include "internal/xxx_utils.h"   // Relative to the library root directory, avoid using `../`
#include "port/xxx_port.h"
// ...

/* Implement all API functions declared in xxx.h */

xxx_err_t xxx_init(xxx_handle_t *hxxx) {
  if (!hxxx) return xxx_ERR_PARAM;
  if (hxxx->state != xxx_STATE_UNINIT) return xxx_OK;
  xxx_err_t err = xxx_port_init(hxxx);
  if (err) return err;
  // ...
  hxxx->state = xxx_STATE_INITIALIZED;
  return xxx_OK;
}

void xxx_urx_isr(xxx_handle_t *hxxx) {
  if (!hxxx) return;
  // ...
#if xxx_USE_RTOS
  xxx_port_notify(hxxx);
  // ...
#endif
}
// ...
```

### `internal/*`

Contains internal auxiliary utility functions, sub-modules, resource files, etc., named in the `xxx_xxxx.h/.c` format. These files are **not exposed externally** and are only called internally by `xxx.c`.

### `port/xxx_port.h(.c)`

Acts as the translation layer between the Core Layer and the HAL layer. It is the *only* part allowed to include platform HAL libraries, written according to the target platform. Visible to the Core Layer.

```c
// xxx_port.h
#pragma once
#include "xxx_types.h"
// ...

#ifdef __cplusplus
extern "C" {
#endif

/* Do not include any platform HAL here; move to `xxx_port.c` */

/* Declare all internal API functions that need porting and add Doxygen comments, especially specifying parameters and return values to facilitate implementation */

/**
 * @brief xxx peripheral initialization
 * @param hxxx instance handle
 * @return xxx_err_t
 */
xxx_err_t xxx_port_init(xxx_handle_t *hxxx);
/**
 * @brief Delay function
 * @param ms delay time in milliseconds
 */
void xxx_port_delay(uint32_t ms);
#if xxx_USE_RTOS
// RTOS functions, implement as needed
xxx_err_t xxx_port_mutex_lock(xxx_handle_t *hxxx);  // Mutex management is handled by port_init
void xxx_port_mutex_unlock(xxx_handle_t *hxxx);
uint32_t xxx_port_enter_critical(void);
void xxx_port_exit_critical(uint32_t token);
void xxx_port_notify(xxx_handle_t *hxxx);   // Task synchronization
// ...
#endif
/**
 * @brief Interrupt handling logic involving HAL, called by xxx_urx_isr
 */
void xxx_port_urx_isr(void);

#ifdef __cplusplus
}
#endif
```

```c
// xxx_port_stm32.c
#include "xxx_port.h"
#include "xxx_config.h"
#include "stm32xxx_hal.h"   // The only place in the driver library where HAL can be included
// ...

#if xxx_USE_RTOS
#include "FreeRTOS.h"

static inline bool scheduler_state(void) {
  if (__get_IPSR() != 0u) return false;                        // osDelay is forbidden in ISR context
  return xTaskGetSchedulerState() == taskSCHEDULER_RUNNING; // Forbidden before scheduler starts
}
#endif

xxx_err_t xxx_port_init(xxx_handle_t *hxxx) { /* ... */ }   // Note: Translate HAL errors to library error codes

void xxx_port_delay(uint32_t ms) {
#if xxx_USE_RTOS
  if (scheduler_state()) {
    osDelay(ms);
  } else
#endif
  HAL_Delay(ms);
}

// ...
```

### `README.md`

The purpose of this document is to enable users to build a comprehensive understanding of the module and clarify how to port this driver library, thereby facilitating the use of the module. Therefore, this document should be written with the principles of clarity and reproducibility from the user's perspective.

```markdown
# xxx Driver Library

## Overview

### xxx Introduction

(Functions, principles, selection, etc., of the xxx module)

### Usage Instructions

(Electrical characteristics, wiring, configuration, etc.)

### Directory Structure

(Structure of the driver library)

## API Reference

(Complete list and introduction of public APIs, including functions and data types, with call examples)

## Porting Guide

(Introduction to required work and precautions for the Porting Layer)

## Troubleshooting

(Solutions for known and potential issues, and limitations)
```

## Call Example

```c
// Application Layer
#include "xxx.h"
#include "uart.h"

/* Resource Allocation */

typedef struct {  // Compatible with different platforms
  GPIO_TypeDef *port;
  uint16_t pin;
} gpio_t;

UART_HandleTypeDef huartx;
static const gpio_t xxx_gpio = {
  .port = GPIOX,
  .pin = GPIO_PIN_X,
};

xxx_handle_t hxxx = {   // Bind resources to the handle
  .uart = &huartx,
  .gpiox = &xxx_gpio,
  .port = &xxx_port,
  // ...
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

- **API Return Value Conventions**: It is highly recommended to use error codes as function return values and pass data via pointers.
- **const Correctness**: All APIs that do not modify the handle content should use `const xxx_handle_t *hxxx`.
- **CMake Build**: When using CMake for building, compile the Core Layer as a static library and strictly control header file visibility.
- **Flexible Adjustment**: This Skill only provides basic design principles, and the code is for demonstration purposes, to be enabled as needed. If issues are encountered during actual development, they should be discussed with the user for flexible adjustment.

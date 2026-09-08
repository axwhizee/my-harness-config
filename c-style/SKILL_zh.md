---
name: c-style
description: 在编辑、编写或审查 C 代码（.c/.h 文件）时，请始终使用此规则。如果 C 代码风格已经清晰或之前已经确立过，请勿重复调用
metadata: 
  author: axwhizee
  version: 1.3
---

# C 代码风格指南

## 原则

1. **基于 LLVM**：本风格基于 LLVM，任何本指南未涉及的情况默认遵循 LLVM
2. **Token 高效**：优化 Agent 编程体验，削减空白字符，减少 token 消耗。在视觉对齐方面信任编辑器
3. **风格一致**：所有语法结构尽可能采用统一的规则
4. **注释标准化**：清晰区分注释的作用，头文件中的公共 API 使用 Doxygen 注释
5. **现代实践**：吸收 Python、Rust 和现代 C 生态系统的风格规范

## LLVM 风格简述

- 2 个空格缩进，不使用制表符（Tab）缩进
- 左大括号始终在同一行（K&R 风格）
- 控制流关键字后加空格：`if (x)`、`while (y)`、`for (...)`
- 函数调用括号前不加空格：`foo(x)`
- 二元运算符两侧加空格：`a + b`。一元运算符不加空格：`*p`、`!flag`
- 指针声明：`type_t *p`（星号靠近变量名）
- 优先提前返回（Early exit）；`return` 之后不使用 `else`

## 基于 LLVM 的风格改进

### 无 80 列限制 [Token 高效]

**不要**在 80 列处折行，代码可读性由编辑器负责。当行代码过长或明确需要折行时，使用与代码块相似的续行缩进规则，并增加缩进级别

```c
result = some_long_call(
  long_param_a,
  ...
  long_param_x);  // 代码极端长需要折行

int main(void){
  if (condition_a && condition_b && condition_c) {  // 代码非极端长，不折行
    ...
  }
}
```

### switch：case 代码块包裹 [风格一致性]

建议采用代码块包裹每个 case 的代码避免作用域陷阱，同时注意任何代码块都需要增加缩进

```c
switch (op) {
  case OP_ADD: {
    result = a + b;
    break;
  }
  case OP_SUB: {
    result = a - b;
    break;
  }
  default: {
    result = 0;
    break;
  }
}
```

### 注释与文档 [注释标准化]

- `//` 行注释
  - 代码与 `//` 之间至少保留 2 个空格（与 Python PEP 8 行内注释约定保持一致）
  - 对于连续的行，使用空格（不要使用 Tab 字符）在视觉上对齐 `//` 列。优先保证对齐以提高可读性
- `/* */` 节注释
  - 用于解释完整的逻辑块或作为章节标题
  - 对于多行：`/*` 和 `*/` 各自独占一行；中间的每一行都以 ` * ` 开头（星号对齐）；内部的空行也必须包含 ` *`
  - 始终用空行将块注释与周围代码隔开，以在视觉上将其与行尾的 `//` 注释区分开来
- `/** */` Doxygen 注释
  - `.h` 文件中的所有公共函数声明和文件头必须使用

```c
/* 屏幕参数配置 */

int width  = 128;   // 视口宽度
int height = 64;    // 视口高度
int depth  = 8;     // 颜色深度

/*
 * 初始化硬件 DMA 控制器
 * 顺序：设置基地址，启用 IRQ，然后启动引擎
 */

dma_set_base_addr(DMA0, BUFFER_BASE);
// 必需
dma_enable_irq(DMA0, IRQ_TRANSFER_DONE);
dma_start_engine(DMA0);

// 处理传入的数据流。
process_stream();
```

```c
/**
 * @file list.h
 * @brief 单向链表操作。
 */

/**
 * @brief 将节点追加到链表末尾。
 *
 * @param self 指向链表实例的指针（不能为 NULL）
 * @param data 存储在新节点中的整数负载（数据）
 * @return 成功时返回 list_error_t 类型的 LIST_ERR_NONE
 */
list_error_t list_append(list_node_t *self, int data);
```

### 命名：snake_case + _t [现代实践]

- 优先遵守项目明确的命名规范或限制
- 变量/函数/标签采用 `snake_case` 蛇形命名法
- 宏/常量采用 `UPPER_SNAKE_CASE` 大写蛇形命名法
- `typedef` 定义的类采用 `snake_case_t`

```c
/* 变量、函数、struct/union/enum 标签：snake_case */

int node_count;
void list_init(void);
struct list_node { ... };

/* Typedef 别名：snake_case + _t 后缀 */

typedef struct list_node list_node_t;
typedef enum list_error list_error_t;

/* 宏、常量、枚举值：UPPER_SNAKE_CASE 全大写蛇形命名法 */

#define MAX_BUFFER_SIZE 4096
typedef enum {
  LIST_ERR_NONE = 0,
  LIST_ERR_ALLOC_FAILED
} list_error_t;
```

### 头文件保护

使用 `#pragma once` 作为 include guards，若编译器不支持则降级为 `#ifndef MODULE_NAME_H` 形式

### 面向对象风格的方法约定 [现代实践]（可选）

操作某种类型的函数，将该类型的指针作为第一个参数，并命名为 `self`。这在没有宏技巧的情况下，模拟了面向对象方法调用的语义

```c
void list_node_append(list_node_t *self, int data);
void list_node_destroy(list_node_t *self);
list_error_t list_find(const list_t *self, int key, list_node_t **out);
list_error_t list_append(list_t *self, int data);
```

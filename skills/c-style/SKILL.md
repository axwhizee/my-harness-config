---
name: c-style
description: Always use this rule when editing, writing, or reviewing C code (.c/.h files). Do not invoke it repeatedly if the C code style is already clear or has been previously established.
metadata: 
  author: axwhizee
  version: 1.4
---

# C Code Style Guide

## Principles

1. **LLVM-Based**: This style is based on LLVM. For any cases not explicitly covered by this guide, default to LLVM standards.
2. **Token Efficiency**: Optimize the agent's programming experience by minimizing whitespace characters to reduce token consumption. Trust the code editor for visual alignment.
3. **Consistent Style**: Adopt unified rules for all syntactic structures wherever possible.
4. **Standardized Comments**: Clearly distinguish the purpose of comments. Use Doxygen comments for public APIs in header files.
5. **Modern Practices**: Incorporate style guidelines derived from Python, Rust, and modern C ecosystems.

## LLVM Style Overview

- Use 2 spaces for indentation; no tabs.
- Left curly braces always on the same line (K&R style).
- Space after control flow keywords: `if (x)`, `while (y)`, `for (...)`.
- No space before function call parentheses: `foo(x)`.
- Spaces around binary operators: `a + b`. No space for unary operators: `*p`, `!flag`.
- Pointer declaration: `type_t *p` (asterisk attached to the variable name).
- Prefer early exit; do not use `else` after `return`.

## LLVM-based Style Improvements

### No 80-Column Limit [Token-Efficient]

**Do not** hard-wrap lines at the 80-column limit. Code readability is the editor's responsibility; avoid excessive whitespace.

```c
int main(void){
  if (condition_a && condition_b && condition_c) {  // No line wrapping
    ...
  }
}

result = some_long_call(
  long_param_a,
  ...
  long_param_x);  // When line wrapping is necessary in special cases, increase the indentation level (similar to code blocks; wrap from the opening parenthesis if applicable)
```

### switch: Wrap case Blocks [Style Consistency]

It is recommended to wrap the code for each `case` in blocks to avoid scope traps. Note that any code block requires increased indentation.

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

### Comments and Documentation [Comment Standardization]

- `//` Line comments
  - Keep at least 2 spaces between the code and `//` (consistent with Python PEP 8 inline comment conventions).
  - For consecutive lines, use spaces (do not use Tab characters) to visually align the `//` columns. Prioritize alignment for readability.
- `/* */` Section comments
  - Used to explain complete logical blocks or as section titles.
  - For multiple lines: `/*` and `*/` must each occupy their own line; every intermediate line starts with ` * ` (asterisk aligned); empty lines inside the block must also contain ` *`.
- `/** */` Doxygen comments
  - Must be used for all public function declarations and file headers in `.h` files.
- No punctuation at the end of the line

```c
/* Screen parameter configuration */

int width  = 128;   // Viewport width
int height = 64;    // Viewport height
int depth  = 8;     // Color depth

/*
 * Initialize hardware DMA controller
 * Sequence: set base address, enable IRQ, then start engine
 */

dma_set_base_addr(DMA0, BUFFER_BASE);
dma_enable_irq(DMA0, IRQ_TRANSFER_DONE);
process_stream();   // Process incoming data stream
```

```c
/**
 * @file list.h
 * @brief Singly linked list operations
 */

/**
 * @brief Append a node to the end of the list
 *
 * @param self Pointer to the list instance (must not be NULL)
 * @param data Integer payload (data) stored in the new node
 * @return LIST_ERR_NONE of type list_error_t on success
 */
list_error_t list_append(list_node_t *self, int data);
```

### Naming: snake_case + _t [Modern Practices]

- Prioritize adhering to the project's explicit naming conventions or constraints.
- Use `snake_case` for variables, functions, and struct/union/enum tags.
- Use `UPPER_SNAKE_CASE` for macros and constants.
- Use `snake_case_t` suffix for `typedef` aliases.

```c
/* Variables, functions, struct/union/enum tags: snake_case */

int node_count;
void list_init(void);
struct list_node { ... };

/* Typedef aliases: snake_case + _t suffix */

typedef struct list_node list_node_t;
typedef enum list_error list_error_t;

/* Macros, constants, enum values: UPPER_SNAKE_CASE */

#define MAX_BUFFER_SIZE 4096
typedef enum {
  LIST_ERR_NONE = 0,
  LIST_ERR_ALLOC_FAILED
} list_error_t;
```

### Header File Guards

Use `#pragma once` as include guards. If the compiler does not support it, fallback to the `#ifndef MODULE_NAME_H` format.

### Object-Oriented Style Method Conventions [Modern Practices] (Optional)

For functions that operate on a specific type, pass a pointer to that type as the first parameter and name it `self`. This simulates object-oriented method call semantics without relying on macro tricks.

```c
void list_node_append(list_node_t *self, int data);
void list_node_destroy(list_node_t *self);
list_error_t list_find(const list_t *self, int key, list_node_t **out);
list_error_t list_append(list_t *self, int data);
```

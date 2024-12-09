## problem - add new behaviour to set of types

- different class perform same action differently
- sometimes add new kind of action to set of related of classes

``` cpp
Manager manager;
manager.serialize();

Underling underling;
underling.serialize();
```


example code
``` cpp

#include <cassert>
#include <cmath>
#include <iostream>


class ASTVisitor;


///////////////////////////////////////////////////////////////////////////////
// An abstract syntax tree expresses the syntactic relationships between
// elements in some form of a program. For instance, the expression `1 + 2`
// would be captured by the tree:
//
//                                   (+)
//                                   / \  
//                                 (1) (2) 
//
// In general, all nodes represent some intermediate computation. The leaf
// nodes of the tree are constants/literals, and the internal nodes reflect
// operations on values.
///////////////////////////////////////////////////////////////////////////////


class ASTNode {
public:
  virtual void accept(ASTVisitor& visitor) = 0;
};


class Constant : public ASTNode {
public:
  Constant(int64_t value)
    : value{value}
      { }

  void accept(ASTVisitor& visitor) override;
  int64_t getValue() const noexcept { return value; }

private:
  int64_t value;
};


class BinaryOperator : public ASTNode {
public:

  enum Kind : uint8_t {
    ADD, SUBTRACT, MULTIPLY, DIVIDE
  };
  
  BinaryOperator(Kind kind, ASTNode& left, ASTNode& right)
    : kind{kind},
      left{left},
      right{right}
      { }

  void accept(ASTVisitor& visitor) override;
  
  // Given the simplicity of these operations, it's possible this should be
  // a POD instead.
  Kind getKind() const noexcept { return kind; }
  ASTNode& getLeft() const noexcept { return left; }
  ASTNode& getRight() const noexcept { return right; }

private:
  Kind kind;
  ASTNode& left;
  ASTNode& right;
};


char
getOperatorChar(BinaryOperator::Kind kind) {
  switch (kind) {
    case BinaryOperator::ADD:      return '+';
    case BinaryOperator::SUBTRACT: return '-';
    case BinaryOperator::MULTIPLY: return '*';
    case BinaryOperator::DIVIDE:   return '/';
  }
}


///////////////////////////////////////////////////////////////////////////////
// A Visitor based infrastructure can allow for extending the underlying
// operations of the abstract syntax trees. First we write the glue that will
// bind things together. This includes the core visitor interface as well as
// the acceptors for the underlying node kinds.
///////////////////////////////////////////////////////////////////////////////

class ASTVisitor {
public:
  virtual void visit(ASTNode& node) = 0;
  virtual void visit(Constant& constant) = 0;
  virtual void visit(BinaryOperator& constant) = 0;
};


void Constant::accept(ASTVisitor& visitor) {
  // Note: because the actual type of node is known within the specific
  // implementation of accept, the appropriate visit method will be invoked.
  visitor.visit(*this);
}


void BinaryOperator::accept(ASTVisitor& visitor) {
  visitor.visit(*this);
}


///////////////////////////////////////////////////////////////////////////////
// At this point, we can go hogwild in writing new visitors that operate on
// the AST in different ways. This type of flexible extension is where the
// Visitor pattern is most useful. It allows for the core model to be in one
// place (like a library), while behaviors can be developed separately (such
// as an application that makes use of a library).
///////////////////////////////////////////////////////////////////////////////


class Evaluator : public ASTVisitor {
public:
  void visit(ASTNode& node) override {
    assert(false && "Invalid node during evaluation");
  }

  // For this visitor, we will always store the result in `result` after a call
  // to `visit`.

  void visit(Constant& constant) override {
    result = constant.getValue();
  }

  void visit(BinaryOperator& op) override {
    op.getLeft().accept(*this);
    int64_t left = result;
    op.getRight().accept(*this);
    int64_t right = result;

    switch (op.getKind()) {
      case BinaryOperator::ADD:      result = left + right; break;
      case BinaryOperator::SUBTRACT: result = left - right; break;
      case BinaryOperator::MULTIPLY: result = left * right; break;
      case BinaryOperator::DIVIDE:   result = left / right; break;
    }
  }

  int64_t getResult() { return result; }

private:
  int64_t result = 0;
};


class PrettyPrinter : public ASTVisitor {
public:
  void visit(ASTNode& node) override {
    assert(false && "Invalid node during evaluation");
  }

  void visit(Constant& constant) override {
    std::cout << constant.getValue();
  }

  void visit(BinaryOperator& op) override {
    char opChar = getOperatorChar(op.getKind());
    std::cout << '(';
    op.getLeft().accept(*this);
    std::cout << ' ' << opChar << ' ';
    op.getRight().accept(*this);
    std::cout << ')';
  }
};


class RPNPrinter : public ASTVisitor {
public:
  void visit(ASTNode& node) override {
    assert(false && "Invalid node during evaluation");
  }

  void visit(Constant& constant) override {
    std::cout << constant.getValue();
  }

  void visit(BinaryOperator& op) override {
    op.getLeft().accept(*this);
    std::cout << " ";
    op.getRight().accept(*this);
    std::cout << ' ' << getOperatorChar(op.getKind());
  }
};


int
main() {
  Constant one{1};
  Constant two{2};
  Constant five{5};
  
  BinaryOperator add(BinaryOperator::ADD, one, two);
  BinaryOperator mult(BinaryOperator::MULTIPLY, add, five);

  Evaluator evaluator;
  mult.accept(evaluator);
  std::cout << evaluator.getResult() << "\n";

  PrettyPrinter pretty;
  mult.accept(pretty);
  std::cout << "\n";

  RPNPrinter rpn;
  mult.accept(rpn);
  std::cout << "\n";

  return 0;
}
```

### example diagram
``` mermaid
classDiagram
    class ASTNode {
        +virtual void accept(ASTVisitor& visitor)
    }
    
    class Constant {
        -int64_t value
        +void accept(ASTVisitor& visitor)
        +int64_t getValue()
    }
    
    class BinaryOperator {
        -Kind kind
        -ASTNode& left
        -ASTNode& right
        +void accept(ASTVisitor& visitor)
        +Kind getKind()
        +ASTNode& getLeft()
        +ASTNode& getRight()
    }
    
    class ASTVisitor {
        +virtual void visit(ASTNode& node)
        +virtual void visit(Constant& constant)
        +virtual void visit(BinaryOperator& binaryOp)
    }
    
    class Evaluator {
        -int64_t result
        +void visit(ASTNode& node)
        +void visit(Constant& constant)
        +void visit(BinaryOperator& op)
        +int64_t getResult()
    }
    
    class PrettyPrinter {
        +void visit(ASTNode& node)
        +void visit(Constant& constant)
        +void visit(BinaryOperator& op)
    }
    
    class RPNPrinter {
        +void visit(ASTNode& node)
        +void visit(Constant& constant)
        +void visit(BinaryOperator& op)
    }
    
    ASTNode <|-- Constant
    ASTNode <|-- BinaryOperator
    ASTVisitor <|-- Evaluator
    ASTVisitor <|-- PrettyPrinter
    ASTVisitor <|-- RPNPrinter

```
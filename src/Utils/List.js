export default class List {
  constructor() {
    this.head = null;
    this.tail = null;
  }

  push(item) {
    item.prev = this.tail;
    item.next = null;
    if (this.tail) {
      this.tail.next = item;
    }
    this.tail = item;
    if (!this.head) {
      this.head = item;
    }
  }

  pop() {
    let item = this.tail;
    if (!item) { return null; }
    this.tail = item.prev;
    if (this.tail) {
      this.tail.next = null;
    }
    if (item === this.head) {
      this.head = null;
    }
    item.prev = null;
    item.next = null;
    return item;
  }

  shift() {
    let item = this.head;
    if (!item) { return null; }
    this.head = item.next;
    if (this.head) {
      this.head.prev = null;
    }
    if (item === this.tail) {
      this.tail = null;
    }
    item.prev = null;
    item.next = null;
    return item;
  }


  remove(item) {
    if (item === this.head) {
      this.shift();
    } else if (item === this.tail) {
       this.pop();
    } else {
      if (item.prev) { item.prev.next = item.next; }
      if (item.next) { item.next.prev = item.prev; }
      item.prev = null;
      item.next = null;
    }
  }
}


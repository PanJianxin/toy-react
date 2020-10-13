const RENDER_TO_DOM = Symbol("Render to dom");

export class Component {
    constructor() {
        this.props = Object.create(null);
        this.children = [];
        this._range = null;
    }

    setAttribute(name, value) {
        this.props[name] = value;
    }

    appendChild(component) {
        this.children.push(component);
    }

    get virtualDom() {
        return this.render().virtualDom;
    }

    [RENDER_TO_DOM](range) {
        this._range = range;
        this._virtualDom = this.virtualDom;
        this._virtualDom[RENDER_TO_DOM](range);
        // this.render()[RENDER_TO_DOM](range);
    }

    update() {
        let isSameNode = (oldNode, newNode) => {
            if (oldNode.type !== newNode.type || Object.keys(oldNode).length !== Object.keys(newNode).length) {
                return false;
            }
            for (let name in newNode.props) {
                if (newNode.props[name] !== oldNode.props[name]) {
                    return false;
                }
            }
            if (newNode.type === "#text") {
                return newNode.content === oldNode.content;
            }
            return true;
        }
        let update = (oldNode, newNode) => {
            if (!isSameNode(oldNode, newNode)) {
                newNode[RENDER_TO_DOM](oldNode._range);

            } else {
                newNode._range = oldNode._range;
                let oldChildren = oldNode.virtualChildren;
                let newChildren = newNode.virtualChildren;

                if (!newChildren || !newChildren.length) {
                    return;
                }

                let tailRange = oldChildren[oldChildren.length - 1]._range;

                for (let i = 0; i < newChildren.length; i++) {
                    let newChild = newChildren[i];
                    if (i < oldChildren.length) {
                        let oldChild = oldChildren[i];
                        update(oldChild, newChild);
                    } else {
                        let range = document.createRange();
                        range.setStart(tailRange.endContainer, tailRange.endOffset);
                        range.setEnd(tailRange.endContainer, tailRange.endOffset);
                        newChild[RENDER_TO_DOM](range);
                        tailRange = range;
                    }
                }
            }

        }
        let virtualDom = this.virtualDom;
        update(this._virtualDom, virtualDom);
        this._virtualDom = virtualDom;
    }

    setState(newState) {
        if (this.state === null || typeof this.state !== "object") {
            this.state = newState;
        } else {
            let merge = (oldState, newState) => {
                for (let field in newState) {
                    if (oldState[field] === null || typeof oldState[field] !== "object") {
                        oldState[field] = newState[field];
                    } else {
                        merge(oldState[field], newState[field])
                    }
                }

            };
            merge(this.state, newState);
        }
        this.update();
    }
}

class ElementWrapper extends Component {
    constructor(type) {
        super(type);
        this.type = type;
    }

    get virtualDom() {
        this.virtualChildren = this.children.map(child => child.virtualDom);
        return this;
    }

    [RENDER_TO_DOM](range) {
        this._range = range;
        let root = document.createElement(this.type);

        for (let name in this.props) {
            let value = this.props[name];
            if (name.match(/^on([\s\S]+)$/)) {
                root.addEventListener(RegExp.$1.replace(/^[\s\S]/, char => char.toLowerCase()), value);
            } else if (name === "className") {
                root.setAttribute("class", value);
            } else {
                root.setAttribute(name, value);
            }
        }

        if (this.virtualChildren === null) {
            this.virtualChildren = this.children.map(child => child.virtualDom);
        }

        for (let child of this.virtualChildren) {
            let childRange = document.createRange();
            childRange.setStart(root, root.childNodes.length);
            childRange.setEnd(root, root.childNodes.length);
            childRange.deleteContents();
            child[RENDER_TO_DOM](childRange);
        }

        replaceContent(range, root);
    }
}

class TextWrapper extends Component {
    constructor(content) {
        super(content);
        this.type = "#text";
        this.content = content;
    }

    get virtualDom() {
        return this;
        // return {
        //     type: "#text",
        //     content: this.content,
        //     children: this.children.map(child => child.virtualDom)
        // }
    }

    [RENDER_TO_DOM](range) {
        this._range = range;
        let root = document.createTextNode(this.content);
        replaceContent(range, root);
    }
}

function replaceContent(range, node) {
    range.insertNode(node);
    range.setStartAfter(node);
    range.deleteContents();

    range.setStartBefore(node);
    range.setEndAfter(node);
}

export function createElement(type, attributes, ...children) {
    let element;
    if (typeof type === "string") {
        element = new ElementWrapper(type);
    } else {
        element = new type;
    }
    for (let attr in attributes) {
        element.setAttribute(attr, attributes[attr]);
    }
    let insertChildren = (children) => {
        for (let child of children) {
            if (child === null) {
                continue;
            }
            if (typeof child === "string") {
                child = new TextWrapper(child);
            }
            if (typeof child === "object" && child instanceof Array) {
                insertChildren(child);
            } else {
                element.appendChild(child);
            }
        }
    }
    insertChildren(children);
    return element;
}

export function render(component, parentElement) {
    let range = document.createRange();
    range.setStart(parentElement, 0);
    range.setEnd(parentElement, parentElement.childNodes.length);
    range.deleteContents();
    component[RENDER_TO_DOM](range);
}
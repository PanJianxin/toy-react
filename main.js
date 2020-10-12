import {createElement, Component, render} from "./toy-react";

class MyComponent extends Component {
    render() {
        return <div>
            <h1>My component</h1>
            {this.children}
        </div>
    }
}

render(<MyComponent id="Id" class="class">
    父文本
    <div id="Child1" class="child-class-1">
        子文本1
    </div>
    <div id="Child2" class="child-class-2">
        子文本2
    </div>
</MyComponent>, document.body);
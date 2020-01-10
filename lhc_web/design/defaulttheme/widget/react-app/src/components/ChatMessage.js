import React, { PureComponent } from 'react';
import parse, { domToReact } from 'html-react-parser';
import { connect } from "react-redux";
import { updateTriggerClicked, subscribeNotifications } from "../actions/chatActions";

class ChatMessage extends PureComponent {

    constructor(props) {
        super(props);
        this.abstractClick = this.abstractClick.bind(this);
        this.imageLoaded = this.imageLoaded.bind(this);
        this.updateTriggerClicked = this.updateTriggerClicked.bind(this);
        this.processBotAction = this.processBotAction.bind(this);
        this.disableEditor = false;
        this.delayData = [];
    }

    /**
     * Here we handle bot buttons actions
     * */
    abstractClick(attrs, e) {
        if (attrs.onclick.indexOf('lhinst.updateTriggerClicked') !== -1) {
            this.updateTriggerClicked({type:'/(type)/triggerclicked'}, attrs, e.target);
        } else if (attrs.onclick.indexOf('notificationsLHC.sendNotification') !== -1) {

            this.props.dispatch(subscribeNotifications());
            e.target.innerHTML = 'Subscribing...';
            setTimeout(() => {
                this.removeMetaMessage(attrs['data-id']);
            }, 500);

        } else if (attrs.onclick.indexOf('lhinst.buttonClicked') !== -1) {
            this.updateTriggerClicked({type:''}, attrs, e.target);
        } else if (attrs.onclick.indexOf('lhinst.updateChatClicked') !== -1) {
            this.updateTriggerClicked({type:'',mainType: 'updatebuttonclicked'}, attrs, e.target);
        } else if (attrs.onclick.indexOf('lhinst.editGenericStep') !== -1) {
            this.updateTriggerClicked({type:'/(type)/editgenericstep'}, attrs, e.target);
        } else if (attrs.onclick.indexOf('lhinst.dropdownClicked') !== -1) {
            const list = document.getElementById('id_generic_list-' + attrs['data-id']);
            if (list && list.value != "0" && list.value != "") {
                attrs['data-payload'] = list.value;
                this.updateTriggerClicked({type:'/(type)/valueclicked'}, attrs, e.target);
            } else {
                alert('Please choose!');
            }
        } else {
            console.log('Unknown click event: ' + attrs.onclick);
        }

        e.preventDefault();
        this.props.focusMessage();
    }

    removeMetaMessage(messageId) {
        setTimeout(() => {
            var block = document.getElementById('msg-' + messageId);
            if (block) {
                var x = block.getElementsByClassName("meta-message-" + messageId);
                var i;
                for (i = 0; i < x.length; i++) {
                    x[i].parentNode.removeChild(x[i]);
                }
            }
        },500);
    }

    updateTriggerClicked(paramsType, attrs, target) {
        this.props.dispatch(updateTriggerClicked(paramsType, {payload: attrs['data-payload'], id : attrs['data-id'], processed : (typeof attrs['data-keep'] === 'undefined')})).then(() => {
            if (!attrs['data-keep']) {
                this.removeMetaMessage(attrs['data-id']);
            }
            this.props.updateMessages();
            this.props.updateStatus();
        });
    }

    imageLoaded(attrs) {
        if (this.props.scrollBottom) {
            this.props.scrollBottom();
        }
    }

    componentDidMount() {

        this.props.setMetaUpdateState(this.props.msg.indexOf('meta-auto-hide') !== -1);

        if (this.disableEditor == true) {
            this.props.setEditorEnabled(false);
        } else {
            this.props.setEditorEnabled(true);
        }

        if (this.delayData.length > 0) {
            this.delayData.forEach((item) => {
                this.props.sendDelay(item);
            })
        }
    }

    processBotAction(attr) {
        if (attr['data-bot-action'] == 'lhinst.disableVisitorEditor') {
            this.disableEditor = true;
        } if (attr['data-bot-action'] == 'lhinst.setDelay') {
            this.delayData.push(JSON.parse(attr['data-bot-args']));
        }
    }

    render() {
        return parse(this.props.msg, {

            replace: domNode => {
                if (domNode.attribs) {

                    var cloneAttr = Object.assign({}, domNode.attribs);

                    if (domNode.attribs.class) {
                        domNode.attribs.className = domNode.attribs.class;
                        delete domNode.attribs.class;
                    }

                    if (domNode.attribs.onclick) {
                        delete domNode.attribs.onclick;
                    }

                    if (domNode.name && domNode.name === 'img') {
                        return <img {...domNode.attribs} onLoad={this.imageLoaded} onClick={(e) => this.abstractClick(cloneAttr, e)} />
                    } else if (domNode.name && domNode.name === 'button') {
                        if (cloneAttr.onclick) {
                            return <button {...domNode.attribs} onClick={(e) => this.abstractClick(cloneAttr, e)} >{domToReact(domNode.children)}</button>
                        }
                    } else if (domNode.name && domNode.name === 'a') {
                        if (cloneAttr.onclick) {
                            return <a {...domNode.attribs} onClick={(e) => this.abstractClick(cloneAttr, e)} >{domToReact(domNode.children)}</a>
                        }
                    } else if (domNode.name && domNode.name === 'script' && domNode.attribs['data-bot-action']) {
                        this.processBotAction(domNode.attribs);
                    }
                }
            }
        });
    }
}

export default  connect()(ChatMessage);
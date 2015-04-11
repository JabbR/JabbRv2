import React from 'react'

let Room = React.createClass({
    contextTypes: {
        router: React.PropTypes.func
    },
    render() {
	var { roomName } = this.context.router.getCurrentParams();
        return (
            <div>Welcome to {roomName}!</div>
        );
    }
});

export default Room;

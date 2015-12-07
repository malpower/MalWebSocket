# MalWebSocket
My Websocket class made by 100% pure javascript.


##How to use

```javascript
var net=require("net");
var MSocket=require("./MSocket");


var server=net.createServer(function(s)
{
    var socket=new MSocket(s,function()
    {
        socket.bindReader(function(msg)
        {
            console.log(msg.fin);
            console.log(msg.length);
            console.log(msg.opCode);
            console.log(msg.content.toString());
            socket.write("SDLFJSLDFJLSKDFJSLDKJF");
        });
        socket.ack();
        console.log(socket.subProtocol);
    });
});
server.listen(8080);
console.log("Server started!");

```

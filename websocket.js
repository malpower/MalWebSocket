var net=require("net");
var crypto=require("crypto");
var MSocket=require("./MSocket");

var regex=/Sec-WebSocket-Key: [^\r\n]{0,}\r\n/;





var server=net.createServer(function(s)
{
    var socket=new MSocket(s,function()
    {
        socket.bindReader(function(msg)
        {
            console.log(msg.content.toString("utf8"));
            socket.write("SDLFJSLDFJLSKDFJSLDKJF");
        });
        socket.ack();
    });
});
server.listen(8080);
console.log("Server started!");

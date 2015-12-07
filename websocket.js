var net=require("net");
var crypto=require("crypto");
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
            console.log(msg.content.toString("utf8"));
            socket.write("SDLFJSLDFJLSKDFJSLDKJF");
        });
        socket.ack();
    });
});
server.listen(8080);
console.log("Server started!");

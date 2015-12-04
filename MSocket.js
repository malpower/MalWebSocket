var crypto=require("crypto");


function MSocket(oSock,shakeCb)
{
    var that=this;
    var reader=function(){};
    var errHandler=function(){},closeHandler=function(){};
    this.headers=new Object;
    this.oSocket=oSock;
    var bpool=new Buffer(0);
    this.write=function(content)
    {
        if (typeof(content)=="string")
        {
            content=new Buffer(content,"utf8");
        }
        if (!(content instanceof Buffer))
        {
            throw {message: "MSocket.write just accept String or Buffer as parameter!"};
        }
        var len=content.length;
        var msg;
        var cp=0;
        if (len<125)
        {
            msg=new Buffer(2);
            msg.writeUInt8(len,1);
            cp=2;
        }
        else if (len>125 && len<65536)
        {
            msg=new Buffer(4);
            msg.writeUInt8(126,1);
            msg.writeUInt16BE(len,2);
            cp=4;
        }
        else
        {
            msg=new Buffer(10);
            msg.writeUInt8(127,1);
            msg.writeUInt32BE(len&0xFFFF,2);
            msg.writeUInt32BE(len>32,6);
            cp=10;
        }
        msg.writeUInt8(0x81,0);
        msg=Buffer.concat([msg,content]);
        oSock.write(msg);
    };
    function RawReader()
    {

        var len=GetPayloadLength();
        var plPos=2;
        if (len==null)
        {
            return;
        }
        var correctLength=len+2;
        if ((bpool.readUInt8(1)&0x80)==0x80)
        {
            correctLength+=4;
            plPos+=4;
        }
        if (len>125 && len<65536)
        {
            correctLength+=2;
            plPos+=2;
        }
        if (len>65535)
        {
            correctLength+=8;
            plPos+=8;
        }
        if (bpool.length<correctLength)
        {
            return;
        }
        var msg=new Object;
        msg.length=len;
        msg.fin=((bpool.readUInt8(0)&0x80)==0x80?true:false);
        msg.opCode=bpool.readUInt8(0)&0x0F;
        msg.mask=((bpool.readUInt8(1)&0x80)==0x80?true:false);
        if (msg.mask)
        {
            msg.maskCode=bpool.slice(plPos-4,plPos);
        }
        else
        {
            msg.maskCode=new Buffer(0);
        }
        var buff=bpool.slice(0,correctLength);
        bpool=bpool.slice(correctLength);
        var content=new Buffer(len);
        for (var i=0;i<len;i++)
        {
            if (msg.mask)
            {
                content.writeUInt8(buff.readUInt8(plPos+i)^msg.maskCode.readUInt8(i%4),i);
            }
            else
            {
                content.writeUInt8(buff.readUInt8(plPos+i),i);
            }
        }
        msg.content=content;
        reader(msg);
    }
    function GetPayloadLength()
    {
        if (bpool.length<2)
        {
            return null;
        }
        var b1=bpool.readUInt8(1);
        b1=b1&0x7F;
        if (b1<126)
        {
            return b1;
        }
        if (b1==126)
        {
            if (bpool.length<4)
            {
                return null;
            }
            return bpool.readUInt16BE(2);
        }
        if (b1==127)
        {
            var len=0;
            if (bpool.length<10)
            {
                return null;
            }
            len=bpool.readUInt32BE(2);
            len=len<<32;
            len+=bpool.readUInt32BE(6);
            return len;
        }
    }
    this.bindReader=function(fn)
    {
        reader=fn;
        oSock.on("data",function(chunk)
        {
            bpool=Buffer.concat([bpool,chunk]);
            RawReader();
        });
    };
    this.bindHandler=function(fn)
    {
        errHandler=fn;
    };
    this.closeHandler=function(fn)
    {
        closeHandler=fn;
    };
    this.ack=function()
    {
        var hash=crypto.createHash("sha1");
        var key=this.headers["Sec-WebSocket-Key"];
        key+="258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
        hash.update(key);
        key=hash.digest("base64");
        oSock.write("HTTP/1.1 101 Switching Protocols\r\n");
        oSock.write("Upgrade: websocket\r\n");
        oSock.write("Connection: Upgrade\r\n");
        oSock.write("Sec-WebSocket-Accept: "+key+"\r\n\r\n");
    };
    oSock.once("data",function(chunk)
    {
        var lines=chunk.toString("utf8").split("\r\n");
        for (var i=1;i<lines.length;i++)
        {
            that.headers[lines[i].split(": ")[0]]=lines[i].split(": ")[1];
        }
        that.subProtocol=lines[0].match(/\/[^\s]*\s/)[0];
        try
        {
            shakeCb(that);
        }
        catch (e)
        {
            console.log(e);
            oSock.end();
        }
    }).on("error",function(e)
    {
        errHandler(that,e);
    });
    //socket.end();
}


module.exports=MSocket;

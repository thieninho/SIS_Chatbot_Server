function getPayload(payLoad, information) 
{
    if (payLoad == "DISCOVER") 
    {
        return 'DLA_DISCOVERY;v1.0;FIND_REQ;AnswerPort=4089;Version=2.0';
    }
    else if (payLoad == "WINK") 
    {
        return 'DLA_DISCOVERY;v1.0;WINK_REQ;DeviceSerial=G21L80705;MAC=00:07:BE:3E:0C:68;Node=0';
    }
}
<?php
error_reporting(0);
use RobRichards\WsePhp\WSASoap;
use RobRichards\WsePhp\WSSESoap;
use RobRichards\XMLSecLibs\XMLSecurityKey;
use Webmozart\PathUtil\Path;

require_once __DIR__ . '/vendor/autoload.php';

class mySoap extends SoapClient
{
    // private string $privateKeyFilePath;
    // private string $certFilePath;

    public function __construct(string $privateKeyFilePath, string $certFilePath, $wsdl, array $options = null)
    {
        parent::__construct($wsdl, $options);
        $this->privateKeyFilePath = $privateKeyFilePath;
        $this->certFilePath = $certFilePath;
    }

    /**
     * @param string $request
     * @param string $location
     * @param string $action
     * @param int $version
     * @param null $one_way
     * @return string
     * @throws Exception
     */
    public function __doRequest($request, $location, $action, $version, $one_way = null)
    {
        $dom = new DOMDocument();
        // $dom->loadXML($_POST['request'] ?? $request);
        $dom->loadXML(request);

        $objWSA = new WSASoap($dom);

        $objWSA->addAction($action);
        $objWSA->addTo($location);
        $objWSA->addMessageID();
        $objWSA->addReplyTo();

        $dom = $objWSA->getDoc();

        $objWSSE = new WSSESoap($dom, false);
        /* Sign all headers to include signing the WS-Addressing headers */
        $objWSSE->signAllHeaders = TRUE;

        $objWSSE->addTimestamp(3600);

        /* create new XMLSec Key using RSA SHA-1 and type is private key */
        $objKey = new XMLSecurityKey(XMLSecurityKey::RSA_SHA1, array('type' => 'private'));

        /* load the private key from file - last arg is bool if key in file (TRUE) or is string (FALSE) */
        // $objKey->loadKey($_POST['privateKey'] ?? $this->privateKeyFilePath,$_POST['privateKey'] ? FALSE : TRUE);
        $objKey->loadKey(key , FALSE );

        /* Sign the message - also signs appropriate WS-Security items */
        $objWSSE->signSoapDoc($objKey);

        /* Add certificate (BinarySecurityToken) to the message and attach pointer to Signature */
        // $token = $objWSSE->addBinaryToken($_POST['publicKey'] ?? file_get_contents($this->certFilePath));
        
        $token = $objWSSE->addBinaryToken(cert);
        $objWSSE->attachTokentoSig($token);

        $request = $objWSSE->saveXML();
        
        die('---start---'.json_encode(array("statusCode" => 200,
        "xmlRequest" => 
        str_replace('<?xml version="1.0"?>
', '', $request))
            ).'---end---'
        );
        return parent::__doRequest($request, $location, $action, $version);
      
    }
}
if (!$argv[1])
    die('---start---'.json_encode(array("statusCode" => '400',
        "message" => 'Invalid requestS')
        ).'---end---'
    );
$data = json_decode(base64_decode($argv[1]), true);
define("request", $data["request"]);
define("cert", $data["cert"]);
define("key", $data["key"]);
$privateKeyFilePath = Path::join(__DIR__, '.config', 'private.pem');
$certFilePath = Path::join(__DIR__, '.config', 'cert.crt');

$soap = new mySoap(
    $privateKeyFilePath,
    $certFilePath,
    Path::join(__DIR__, '.config/', 'test4.wsdl' ),
    array(
        'soap_version' => SOAP_1_1,
        'trace' => 1,
        'exceptions' => 0,
    ));
$array = array();
try {
    $out = $soap->testWsdl($array);
} catch (SoapFault $fault) {
    die('---start---'.json_encode(array("statusCode" => '400',
        "message" => 'Invalid requestS')
        ).'---end---'
    );
}
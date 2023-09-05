DELIMITER $$
CREATE DEFINER=`root`@`localhost` FUNCTION `GeoDistMiles`(`lat1` FLOAT(8,2), `lon1` FLOAT(8,2), `lat2` FLOAT(8,2), `lon2` FLOAT(8,2), `mes` VARCHAR(255)) RETURNS float
    NO SQL
    DETERMINISTIC
    BEGIN
        DECLARE dis FLOAT;
        DECLARE R FLOAT;
        DECLARE radiansLat FLOAT;
        DECLARE radiansLong FLOAT;
        DECLARE a FLOAT;
        DECLARE c FLOAT;
        
        SET R = 3958.7558657440545;
        SET radiansLat = RADIANS(lat2 - lat1);
        SET radiansLong = RADIANS(lon2 - lon1);
        
        SET a = SIN(radiansLat/2) * SIN(radiansLat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *  SIN(radiansLong/2) * SIN(radiansLong/2); 
        SET c = 2 * ATAN2(SQRT(a), SQRT(1-a)); 
        SET dis = R * c;
        IF mes='mt' THEN
            RETURN dis * 1609.34;
        ELSEIF mes='km' THEN
            RETURN dis  * 1.6;
        ELSEIF mes='nm' THEN
            RETURN dis  * 1.73795;
        ELSE
            RETURN dis;
        END IF;
    END$$
DELIMITER ;
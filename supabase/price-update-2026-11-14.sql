-- NOTE 2026-11-14: the securing values in this file are the old 3x ones; securing is now 6x rent, see securing-6x-rent.sql.
-- Price update 2026-11-14: rents doubled, inspection fees moved into the 300-550 range
-- (60->300, 65->363, 70->425, 75->488, 80->550, keeping the old order), securing kept
-- at 3x the new rent. Applied live via the service role key; run only if the DB
-- still holds the old prices.
update public.properties set rent = 1696, fee = 300, securing = 5088 where slug = 'cozy-two-bedroom-apartment-wittevrouwen';
update public.properties set rent = 1980, fee = 550, securing = 5940 where slug = 'spacious-three-bedroom-house-kralingen';
update public.properties set rent = 2150, fee = 488, securing = 6450 where slug = 'light-two-bedroom-apartment-de-pijp';
update public.properties set rent = 1850, fee = 300, securing = 5550 where slug = 'bright-one-bedroom-apartment-katendrecht';
update public.properties set rent = 2450, fee = 488, securing = 7350 where slug = 'modern-two-bedroom-apartment-jordaan';
update public.properties set rent = 2290, fee = 488, securing = 6870 where slug = 'modern-two-bedroom-apartment-oud-west';
update public.properties set rent = 2190, fee = 488, securing = 6570 where slug = 'sunny-two-bedroom-apartment-oost';
update public.properties set rent = 1990, fee = 425, securing = 5970 where slug = 'bright-three-bedroom-house-woensel';
update public.properties set rent = 1850, fee = 363, securing = 5550 where slug = 'bright-two-bedroom-apartment-merenwijk';
update public.properties set rent = 1750, fee = 363, securing = 5250 where slug = 'bright-two-bedroom-apartment-roombeek';
update public.properties set rent = 1650, fee = 300, securing = 4950 where slug = 'cozy-two-bedroom-apartment-goverwelle';
update public.properties set rent = 1790, fee = 363, securing = 5370 where slug = 'modern-two-bedroom-apartment-klarendal';
update public.properties set rent = 1970, fee = 425, securing = 5910 where slug = 'modern-two-bedroom-apartment-lombok';
update public.properties set rent = 1890, fee = 425, securing = 5670 where slug = 'spacious-three-bedroom-house-helpman';
update public.properties set rent = 1950, fee = 425, securing = 5850 where slug = 'spacious-three-bedroom-house-reeshof';
update public.properties set rent = 3190, fee = 550, securing = 9570 where slug = 'spacious-three-bedroom-house-statenkwartier';
update public.properties set rent = 2990, fee = 550, securing = 8970 where slug = 'spacious-three-bedroom-house-leidsche-rijn';
update public.properties set rent = 1900, fee = 363, securing = 5700 where slug = 'bright-one-bedroom-apartment-noord';
update public.properties set rent = 1750, fee = 363, securing = 5250 where slug = 'bright-one-bedroom-apartment-oog-in-al';
update public.properties set rent = 1490, fee = 300, securing = 4470 where slug = 'bright-one-bedroom-studio-feijenoord';
update public.properties set rent = 2250, fee = 488, securing = 6750 where slug = 'bright-two-bedroom-apartment-scheveningen';
update public.properties set rent = 1730, fee = 363, securing = 5190 where slug = 'bright-two-bedroom-apartment-stadshagen';
update public.properties set rent = 1790, fee = 363, securing = 5370 where slug = 'bright-two-bedroom-apartment-wyck';
update public.properties set rent = 1590, fee = 300, securing = 4770 where slug = 'charming-one-bedroom-apartment-jekerkwartier';
update public.properties set rent = 1850, fee = 363, securing = 5550 where slug = 'cozy-one-bedroom-apartment-bezuidenhout';
update public.properties set rent = 2190, fee = 488, securing = 6570 where slug = 'cozy-three-bedroom-house-kleverpark';
update public.properties set rent = 1650, fee = 300, securing = 4950 where slug = 'cozy-two-bedroom-apartment-centrum-groningen';
update public.properties set rent = 1790, fee = 363, securing = 5370 where slug = 'cozy-two-bedroom-apartment-bottendaal';
update public.properties set rent = 1790, fee = 363, securing = 5370 where slug = 'cozy-two-bedroom-apartment-delfshaven';
update public.properties set rent = 1690, fee = 300, securing = 5070 where slug = 'cozy-two-bedroom-apartment-huiswaard';
update public.properties set rent = 2250, fee = 488, securing = 6750 where slug = 'light-two-bedroom-apartment-ijburg';
update public.properties set rent = 3400, fee = 550, securing = 10200 where slug = 'modern-three-bedroom-apartment-rivierenbuurt';
update public.properties set rent = 2090, fee = 488, securing = 6270 where slug = 'modern-two-bedroom-apartment-centrum-den-haag';
update public.properties set rent = 1950, fee = 425, securing = 5850 where slug = 'modern-two-bedroom-apartment-centrum-haarlem';
update public.properties set rent = 1690, fee = 300, securing = 5070 where slug = 'modern-two-bedroom-apartment-sterrenburg';
update public.properties set rent = 1790, fee = 363, securing = 5370 where slug = 'modern-two-bedroom-apartment-strijp';
update public.properties set rent = 1750, fee = 363, securing = 5250 where slug = 'modern-two-bedroom-apartment-tanthof';
update public.properties set rent = 2090, fee = 488, securing = 6270 where slug = 'spacious-three-bedroom-house-ginneken';
update public.properties set rent = 2790, fee = 550, securing = 8370 where slug = 'spacious-three-bedroom-house-hillegersberg';
update public.properties set rent = 2050, fee = 425, securing = 6150 where slug = 'bright-three-bedroom-house-vathorst';
update public.properties set rent = 1990, fee = 425, securing = 5970 where slug = 'sunny-three-bedroom-house-dubbeldam';
update public.properties set rent = 1950, fee = 425, securing = 5850 where slug = 'modern-two-bedroom-apartment-stevenshof';
update public.properties set rent = 1790, fee = 363, securing = 5370 where slug = 'bright-two-bedroom-apartment-hatert';
update public.properties set rent = 2590, fee = 488, securing = 7770 where slug = 'modern-three-bedroom-house-kattenbroek';
update public.properties set rent = 2390, fee = 488, securing = 7170 where slug = 'light-three-bedroom-house-schuytgraaf';
update public.properties set rent = 2300, fee = 488, securing = 6900 where slug = 'bright-three-bedroom-house-voorhof';
update public.properties set rent = 2190, fee = 425, securing = 6570 where slug = 'charming-three-bedroom-house-oud-noord';
update public.properties set rent = 2100, fee = 425, securing = 6300 where slug = 'cozy-three-bedroom-house-assendorp';
update public.properties set rent = 2700, fee = 550, securing = 8100 where slug = 'modern-three-bedroom-house-princenhage';

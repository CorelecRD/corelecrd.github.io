// Variables
const akeron = {
	Alarme: null,
	Warning: null,
	AlarmeRdx: null,
	AlarmeElx: null,

	valPh: null,
	valSel: null,
	valTemp: null,
	valRdx: null,
	valAmp: null,
	valElx: null,

	// Presence de pompes / capteurs
	PompePlus: null,
	PompeMoins: null,
	PompeChlore: null,
	FlowSwitch: null,
	CapteurSel: null,
	CapteurTemp: null,
	PompesForcees: null,

	// Etat des relais
	PompePlusActive: null,
	PompeMoinsActive: null,
	PompeChlElxActive: null,
	RelaisFilActif: null,
	
	VoletForce: null,
	VoletActif: null,
	BoostActif: null,
	DureeBoost: null,
	Salinite: null,
	Sleep: null,
	Timer: null,
	DureeST: null
};

// Functions
function parseData(buf, appareil) {
	const crc = get_crc(buf.slice(0, 15)); // Calculate CRC for the first 15 bytes

	// Check if the first two bytes match the expected header and if CRC matches
	if (buf[0] === 42 && crc === buf[15]) {
		// Trame 'M' mesures
		switch(buf[1]){
			case 77:
				appareil.valPh = (buf[2] << 8) | buf[3];
				appareil.valRdx = (buf[4] << 8) | buf[5];
				appareil.valTemp = (buf[6] << 8) | buf[7];
				appareil.valSel = (buf[8] << 8) | buf[9];
				
				appareil.Alarme = buf[10];
				// m12 ne traite que la partie pompe dans cette routine (pas le demi octet modele)
				appareil.PompePlusActive = byteToBool(buf[12], 7);
				appareil.PompeMoinsActive = byteToBool(buf[12], 6);
				appareil.PompeChlElxActive = byteToBool(buf[12], 5);
				appareil.RelaisFilActif = byteToBool(buf[12], 4);
				appareil.PompePlus = byteToBool(buf[13], 1);
				appareil.PompeMoins = byteToBool(buf[13], 0);
				appareil.CapteurTemp = byteToBool(buf[13], 2);
				appareil.CapteurSel = byteToBool(buf[13], 3);
				appareil.FlowSwitch |= byteToBool(buf[13], 4);
				appareil.PompeChlore = byteToBool(buf[13], 5);
				appareil.PompesForcees = byteToBool(buf[13], 7);
				appareil.RawFieldM13 = buf[13];
				break;
			case 65:
				appareil.valElx = buf[2];
				appareil.DureeBoost = (buf[3] << 8) | buf[4];
				if (appareil.DureeBoost > 0) appareil.BoostActif = true; else appareil.BoostActif = false;
				appareil.Salinite = buf[10] & 0x03;
				
				appareil.VoletActif = byteToBool(buf[10], 4);
				appareil.VoletForce = byteToBool(buf[10], 3);
				appareil.FlowSwitch = byteToBool(buf[10], 2);
				
				appareil.AlarmeElx = buf[12] & 0x0F;
				
				appareil.Sleep = byteToBool(buf[13], 6) && byteToBool(buf[13],5);
				appareil.Timer = byteToBool(buf[13], 7) && byteToBool(buf[13],5);
				appareil.DureeST = buf[13] & 0x1F;
				break;
			default:
				break;
		}
	}
}

function byteToBool(cible, bit) {
	const masque = Math.pow(2, bit);
	cible &= masque;
	return cible !== 0;
}

function composeRequest(mnemonic) {
	const table = new Uint8Array(7);
	table[0] = 42; // Start
	table[1] = 82; // Request
	table[2] = 63; // ?
	table[3] = mnemonic; // Mnemonic
	table[4] = get_crc(table.slice(0, 4)); // CRC
	table[5] = 42; // Stop

	table[6] = 0;

	return table;
}

function get_crc(array) {
	let result = 0;
	for (let i = 0; i < array.length; i++) {
		result ^= array[i];
	}
	return result;
}

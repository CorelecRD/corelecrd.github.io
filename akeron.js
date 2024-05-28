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
	
	setPh: null,
	setRdx: null,

	// Presence de pompes / capteurs
	PompePlus: null,
	PompeMoins: null,
	PompeChlore: null,
	FlowSwitch: null,
	CapteurSel: null,
	CapteurTemp: null,
	PompesForcees: null,
	RawFieldM13: null,
	RawFieldA10: null,

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
				appareil.RawFieldA10 = buf[10];
				
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

//----------------------------//
//---[ Composition trames ]---//
//----------------------------//
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

function compositionConsigne(donnee, typemesure) {
	let consigne;
	const trame = trameDonneesVide('S');

	switch (typemesure) {
		case 'ph':
			trame[1] = 'S'.charCodeAt(0);
			consigne = donnee;
			trame[2] = highByte(consigne);
			trame[3] = lowByte(consigne);
			break;
		case 'redox':
			trame[1] = 'E'.charCodeAt(0);
			consigne = Math.round(donnee);
			trame[2] = highByte(consigne);
			trame[3] = lowByte(consigne);
			break;
		default:
			break;
	}
	trame[15] = get_crc(trame.slice(0, 15)); // CRC

	return trame;
}

function compositionOffset(donnee, typemesure) {
	let offset;
	const trame = trameDonneesVide('M');

	switch (typemesure) {
		case 'ph':
			offset = Math.round(donnee * 100);
			trame[2] = highByte(offset);
			trame[3] = lowByte(offset);
			break;
		case 'redox':
			offset = Math.round(donnee);
			trame[4] = highByte(offset);
			trame[5] = lowByte(offset);
			break;
		case 'temp':
			offset = Math.round(donnee * 10);
			trame[6] = highByte(offset);
			trame[7] = lowByte(offset);
			break;
		case 'sel':
			offset = Math.round(donnee * 10);
			trame[8] = highByte(offset);
			trame[9] = lowByte(offset);
			break;
		default:
			break;
	}
	trame[15] = get_crc(trame.slice(0, 15)); // CRC

	return trame;
}

function compositionSeuils(seuils, typemesure) {
	let seuilh, seuilb;
	let trame = trameDonneesVide('D');
	if (typemesure === 'ph') trame = trameDonneesVide('S');

	switch (typemesure) {
		case 'temp':
			trame[4] = seuils.Erreurs.Max;
			trame[5] = seuils.Erreurs.Min;
			trame[6] = seuils.Warnings.Max;
			trame[7] = seuils.Warnings.Min;
			break;
		case 'sel':
			trame[8] = seuils.Warnings.Min * 10;
			trame[9] = seuils.Erreurs.Min * 10;
			break;
		case 'ph':
			seuilh = Math.round(seuils.Erreurs.Max * 100);
			seuilb = Math.round(seuils.Erreurs.Min * 100);
			trame[10] = highByte(seuilh);
			trame[11] = lowByte(seuilh);
			trame[12] = highByte(seuilb);
			trame[13] = lowByte(seuilb);
			break;
		default:
			break;
	}
	trame[15] = get_crc(trame.slice(0, 15)); // CRC

	return trame;
}

function compositionValeurVolet(volet) {
	const trame = trameDonneesVide('A');
	trame[9] = volet;
	trame[15] = get_crc(trame.slice(0, 15)); // CRC

	return trame;
}

function compositionActivationBoost(boost) {
	const trame = trameDonneesVide('A');
	trame[3] = highByte(boost);
	trame[4] = lowByte(boost);
	trame[15] = get_crc(trame.slice(0, 15)); // CRC

	return trame;
}

function compositionActivationVolet(appareil) {
	const trame = trameDonneesVide('A');
	trame[10] = byteSet(!appareil.VoletForce, 3, appareil.RawFieldA10);
	trame[15] = get_crc(trame.slice(0, 15)); // CRC

	return trame;
}

function compositionProduction(production) {
	const trame = trameDonneesVide('A');
	trame[2] = production;
	trame[15] = get_crc(trame.slice(0, 15)); // CRC

	return trame;
}

function compositionMoteursForces() {
	const trame = trameDonneesVide('D');
	trame[10] = byteSet(1, 3, 0);
	trame[10] = byteSet(1, 2, trame[10]);
	trame[10] = byteSet(1, 1, trame[10]);
	trame[10] = byteSet(1, 0, trame[10]);
	
	trame[15] = get_crc(trame.slice(0, 15)); // CRC

	return trame;
}

function compositionResetUsine() {
	const trame = trameDonneesVide('M');
	trame[14] = 0xCF;
	trame[15] = get_crc(trame.slice(0, 15)); // CRC
	
	return trame;
}


//-------------------------------//
//---[ Fonctions utilitaires ]---//
//-------------------------------//
function byteToBool(cible, bit) {
	const masque = Math.pow(2, bit);
	cible &= masque;
	return cible !== 0;
}

function byteSet(condition, position, value) {
	if (condition) {
		return value | (1 << position);
	} else {
		return value & ~(1 << position);
	}
}

function highByte(value) {
	return (value >> 8) & 0xFF;
}

function lowByte(value) {
	return value & 0xFF;
}

function get_crc(array) {
	let result = 0;
	for (let i = 0; i < array.length; i++) {
		result ^= array[i];
	}
	return result;
}

function trameDonneesVide(mnemo) {
	const bArray = new Uint8Array(17);
	bArray[0] = 0x2A; // Start byte
	bArray[1] = mnemo.charCodeAt(0); // Convert character to its byte representation

	for (let i = 2; i < 16; i++) {
		bArray[i] = 0xFF; // Fill with 0xFF
	}

	bArray[16] = 0x2A; // End byte

	return bArray;
}

Module.register("MMMAM-MedicalAlert",{

	// Atributos del modulo
	speechAlert: '',

	next: null, // Objeto next - contiene la siguiente alarma

	active: null, // Objeto activo - contiene medicamento vigente dentro del rango de tiempo

	alarmFired: false, // boolean alaermFired - bandera que indica si hay una alarma en este momento

    timer: null,

    sound: null,

    fadeInterval: null,

	listAlerts: {},

    medicalHistory: [],
		voiceAlert: true,

	// Configuracion default del modulo
	default: {
		sound : 'crystals.mp3',
		text: 'Hola Mundo!',
		volume: 1.0,
		format: 'ddd, h:mmA',
		timer: 1000 * 10, //10 seg por default

    volume: 1.0,
    fade: false,
    fadeTimer: 60 * 1000, // 60 seconds
    fadeStep: 0.005, // 0.5%


	},

	getStyles() {
        return ['font-awesome.css'];
    },

  getScripts() {
      return ['moment.js'];
  },

	start() {
        Log.info(`Iniciando modulo: ${this.name}`);

        setInterval(() => {
            this.checkAlarm();
        }, 1000);
       // moment.locale(config.language);
    },

    checkAlarm() {
        const currentTimeMilliseconds = moment().valueOf();
				const timeRangeInMilliseconds = 1000 * 60 * 5; // 1 segundo * 60 segundos * 5 minutos

				// ESTA SECCION VERIFICA SI SE DEBE LANZAR LA ALARMA
        // Si no esta activada la alarma
        if (!this.alarmFired && this.next && ((currentTimeMilliseconds - this.next.startDate) >= 0)) {
            const alert = this.setFormatAlert();

            this.sendNotification('SHOW_ALERT', alert);

            this.alarmFired = true;
            this.updateDom(300);

            this.timer = setTimeout(() => {
                 this.resetAlarmClock();

            }, this.config.timer);

        }
				// ESTA SECCION VERIFICA SI SE DEBE ACTIVAR UNA ALERTA QUE ESTE
				// DENTRO DEL RANGO DE TOMA QUE ES DE 5 MIN.
				// Si hay una siguiente y la alarma activa es diferente de la siguiente y la siguiente esta en el rango de 5 min la ACTIVA
				if (this.next && (this.active !== this.next) && ((this.next.startDate - timeRangeInMilliseconds) <= currentTimeMilliseconds)) { //(((this.next.startDate - timeRangeInMilliseconds) <= currentTimeMilliseconds) && ((this.next.startDate - timeRangeInMilliseconds + 1000) >= currentTimeMilliseconds))) {
					this.active = this.next;
					//console.log("***Entre, la siguiente toma esta en el rango " + this.next.title);
					this.sendNotification("UPDATE_PENDING_MEDICATION", this.active);
				}
				//Si hay una activa y esta fuera del rango de 5 min desactiva
			/*	if (this.active && ((this.active.startDate + timeRangeInMilliseconds) <= currentTimeMilliseconds)) {
					console.log("***SALI, la siguiente toma esta  FUERA DE rango " + this.active);
					this.active = undefined;
					this.sendNotification("UPDATE_PENDING_MEDICATION", this.active);
				}*/

    },

		showDetailsNext(){
			const alert = this.setFormatAlert();
			var speech = this.setSpeechDetailsNext();
			if (speech !== 'No hay medicamentos pendientes para hoy.') {
				this.sendNotification('SHOW_ALERT', alert);
			}
			this.sendNotification('MEDICAL_ALERT_DATA', speech);

		},

		setTimeToNext(){
			if (this.next !== null) {
				return moment(this.next.startDate, "x").fromNow();
			}

		},

		setSpeechTimeToNext(){
			if (this.next) {
				var speechTimeToNext = 'La siguiente toma ' + this.next.title + ' es ' + this.setTimeToNext() + '.';
				return speechTimeToNext;
			}else{
				return 'No hay medicamentos pendientes para hoy.';
			}

		},

		setSpeechDetailsNext(){
			if (this.next) {
				var speechTimeToNext = 'La siguiente toma ' + this.next.title + ' es ' + this.setTimeToNext() + ' y consiste en: ' + this.setDetailsNext()+'.';
				return speechTimeToNext;
			}else{
				return 'No hay medicamentos pendientes para hoy.';
			}

		},

		setDetailsNext(){
			const message = this.next.description;
			const x = message.split(/\n/);

			var details = '';

			for (var i = 0; i < x.length; i++) {
			 // console.log( x[i]);
				const token = x[i].split(",");
				var descriptionMedication = '';
			 // console.log(token[2]);
				if (token[2].includes('inyeccion') || token[2].includes('inyección')) {
					descriptionMedication = 'una inyección de ' + token[1] + ' de ' + token[0] + '. '
				}else {
					descriptionMedication = '' + token[1] + ' de ' + token[0] + '. '
				}
				details += descriptionMedication;
			}

			return details;
		},

		setSpeechAlert(){
			if (this.next) {
				this.speechAlert = 'Es hora de la toma de ' + this.next.title+ '. La toma consiste en: ' + this.setDetailsNext();
				//console.log('++++++' + this.speechAlert);
			}else{
				this.speechAlert = 'No hay mas medicamentos pendientes para hoy.';
			}
		},

    setFormatAlert(){
			//console.log(this.next);
			var titleAlert ="";
			var messageAlert = "";

			if (!this.next) {
				titleAlert = "Medicamentos pendientes";
        messageAlert = "No hay mas medicamentos pendientes para hoy.";
			}else{
        titleAlert = this.next.title;
        messageAlert = "";
        var imageAlert = "";

        //Si es una cita medica
        if (titleAlert.includes("cita") || titleAlert.includes("Cita")) {

            imageName = "cita_medica"+".png";
            var pathImage = this.file("icons/icons_color/"+imageName);
            var labelImage = "" + "<img src=" + pathImage + " width=\"65\" height=\"65\">";

            messageAlert =  "<hr> <p>" + this.next.description + "</p> "+ labelImage ;

        //Si es una toma de medicamento
        }else if (titleAlert.includes("Medicamento") || titleAlert.includes("medicamento") || titleAlert.includes("Medicina") || titleAlert.includes("medicina")){

            const message = this.next.description;
            const x = message.split(/\n/);

            for (var i = 0; i < x.length; i++) {
           // console.log( x[i]);

            const token = x[i].split(",");
           // console.log(token[2]);

            var imageType = token[2];
            var imageName = null;

            // se valida la imagen segun el parametro recibido
            if(imageType.includes("crema")){imageName = "crema"+".png";}
            else if(imageType.includes("gotas")){imageName = "gotero"+".png";}
            else if(imageType.includes("inhalador")){imageName = "inhalador"+".png";}
            else if(imageType.includes("jarabe")){imageName = "jarabe"+".png";}
            else if(imageType.includes("inyeccion") || imageType.includes("inyección")){imageName = "jeringa"+".png";}
            else if(imageType.includes("pildoras") || imageType.includes("píldoras")){imageName = "pills"+".png";}
            else if(imageType.includes("unguento")){imageName = "unguento"+".png";}
            else{
                imageName = "medicamento"+".png";
            }
            var pathImage = this.file("icons/icons_color/"+imageName);
            var labelImage = "" + "<img src=" + pathImage + " width=\"80\" height=\"80\">";
           // console.log(pathImage);

           // se establece el string con formato html
            messageAlert += "<hr><div> " +
                                "<table  style=\"width:100%\" align=\"center\"> " +
                                    "<tr> "+
                                        "<td align=\"left\"> " + token[0] +" </td> " +
                                        "<td rowspan=2 align=\"right\"> " + labelImage + " </td> " +
                                    "</tr> " +
                                    "<tr> " +
                                        "<td align=\"left\"> " + token[1] + " </td> " +
                                    "</tr> " +
                                "</table> " +
                            "</div> " +
                            " ";
        }
        messageAlert+= "<hr>"
        //console.log(messageAlert);
        }else{
            // Si no se recibe uno de los formatos establecidos se muestra la info tal cual
           messageAlert ="<hr> <p>" + this.next.description + "</p> ";
        }
			}


		 // se crea el alert con los formatos establecidos arriba
		 const alert = {
		 	title: titleAlert,
			message: messageAlert // tratar texto
		 };
		  //setSpeechAlert();
      return alert;
    },

    notificationReceived: function(notification, payload, sender) {
			if (notification === "CALENDAR_EVENTS") {
				//console.log("MedicalAlert recibio notificacion de calendario" );
				this.listAlerts = payload;
            //Valida que haya una proxima alarma, aparte de la vigente
          if (this.listAlerts.length > 1) {
            this.setNextAlarm();
          }

			} else if (notification === "CALENDAR_HIDE_MEDICAL_ALERT") {
				this.sendNotification("HIDE_ALERT");
			} else if (notification === "TIME_TO_NEXT") {
				this.sendNotification("MEDICAL_ALERT_DATA", this.setSpeechTimeToNext());
			} else if (notification === "SHOW_DETAIL_NEXT"){
				this.showDetailsNext();
			}
	},

    setNextAlarm() {
        this.next = null;
        const current = moment().valueOf();

        for (let i = 0; i < this.listAlerts.length; i += 1) {

            const temp = this.listAlerts[i].startDate;
                // ordenamos las alertas
            if ((!this.next || (temp - this.next.startDate) < 0)) { //Check this
                // si no hay alarma, verifica que la siguiente aun no halla pasado
                if (!this.next && (current - temp < 0)) {
                    this.next = this.listAlerts[i];
                    this.next.startDate = temp;
                //si ya hay alarma, verifica que ni la actual halla pasado y la siguiente no hallan pasado
                }else if (this.next && (current - this.next.startDate > 0) && (current - temp < 0) ) {
                    this.next = this.listAlerts[i];
                    this.next.startDate = temp;
                }
            }
        }
        if (this.next !== null) {
          //  console.log("*NEXT ALARM: "+ this.next.title);
						this.setSpeechAlert();
        }else{

				}
				//console.log("LA SIGUIENTE TOMA ES EN : " + this.setTimeToNext());
        //this.updateDom(300);
    },

    resetAlarmClock() {

        this.alarmFired = false;
        this.sendNotification('HIDE_ALERT');

        this.addToHistory(this.next, true);

        console.log("**HISTORIAL: ");

        for (let i = 0; i <= (this.medicalHistory.length - 1); i += 1) {
           console.log(this.medicalHistory[i].title);
        }

        this.setNextAlarm();
        this.updateDom(300);
    },



    addToHistory(event, bool){ // recibe la alarma y un booleano para indicar si realizo la toma
        this.medicalHistory.push(event, bool);
    },
/*
    getHistoryToday(){

    },
*/
	/*
	//REGRESA FECHA EN MILISEGUNDOS
	getMoment(alarm) {
        const now = moment();
        let difference = Math.min();
        const hour = parseInt(alarm.time.split(':')[0]);
        const minute = parseInt(alarm.time.split(':')[1]);

        for (let i = 0; i < alarm.days.length; i += 1) {
            if (now.day() < alarm.days[i]) {
                difference = Math.min(alarm.days[i] - now.day(), difference);
            } else if (now.day() === alarm.days[i] && (parseInt(now.hour()) < hour ||
                (parseInt(now.hour()) === hour && parseInt(now.minute()) < minute))) {
                difference = Math.min(0, difference);
            } else if (now.day() === alarm.days[i]) {
                difference = Math.min(7, difference);
            } else {
                difference = Math.min((7 - now.day()) + alarm.days[i], difference);
            }
        }

        return moment().add(difference, 'days').set({
            hour,
            minute,
            second: 0,
            millisecond: 0
        });
    },*/

    //
	// Anulacion del generador DOM
	getDom: function(){

        var wrapper = document.createElement("div");
		//wrapper.innerHTML = this.config.text;

        if (this.next != null) {
       //     wrapper.innerHTML += "/\n/Alarma: "+ this.next.title;

        //Si la alarma esta activa lanza sonido de alarma
        }

        if (this.alarmFired) {
            //console.log("***Entro a SONIDO."+ this.voiceAlert);

						if (this.voiceAlert) {
							console.log("xxxx"+this.speechAlert);
							this.sendNotification("MEDICAL_ALERT_DATA", this.speechAlert);
						}else{
							const sound = document.createElement('audio');
							sound.setAttribute('id', 'MMMAM-MedicalAlert');
							sound.src = this.file("sounds/"+this.config.sound);
							console.log(sound.src);
							sound.volume = this.config.volume;
							sound.setAttribute('autoplay', true);

							wrapper.appendChild(sound);
						}
        }
		return wrapper;
	}
});

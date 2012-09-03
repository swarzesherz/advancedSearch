﻿/*!
 * evol.advancedSearch 0.1
 *
 * Copyright (c) 2012, Olivier Giulieri 
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 *	jquery.ui.datepicker.js
 */

(function( $, undefined ) {

	var EvolLang={
		sEquals:'Equals',
		sStart:'Starts with',
		sContain:'Contains',
		sFinish:'Finishes with',
		sInList:'In list',
		sIsNull:'Is empty',
		sIsNotNull:'Is not empty',		
		sBefore:'Before',
		sAfter:'After',	
		sOn:'On',
		sAt:'At',
		opAnd:' and ',
		//opOr:' or ', 
		yes:'Yes',
		no:'No'
	}
	
	var soEqual = 'eq', soStartWith = 'sw', soFinishWith = 'fw', soContain = 'ct';
	var soIsNull = 'null', soIsNotNull = 'nn', soInList='in'
	var soGreaterThan = 'gt', soSmallerThan = 'st';
/*	var so={
		soEqual: 'eq', 
		soStartWith: 'sw', 
		soFinishWith: 'fw', 
		soContain: 'ct',
		soIsNull: 'null', 
		soIsNotNull: 'nn',
		soGreaterThan: 'gt', 
		soSmallerThan: 'st',
		soInList: 'in'
	} */	
	
	fieldTypes= { 
		text: 'text',
		//txtm: 'textmultiline',
		bool: 'boolean',
		dec: 'decimal',
		integer: 'integer',
		date: 'date',
		time: 'time',
		datetime: 'datetime',
		pix: 'image',
		doc: 'document',
		lov: 'lov'//,
		//formula: 'formula',
		//html: 'html',
		//email: 'email',
		//url: 'url'
	} 
	 
	
$.widget( 'evol.advancedSearch', {

    options: {
        fields: [] 
    },
	
    _create: function() {
		var h=[],
			that=this,
			opts=this.options,
			e=this.element;
		this.state=-1;
		this._fMaxId=0;
		h.push('<div class="searchFilters"></div>');
		h.push('<a class="bPlus" href="javascript:void(0)">New filter</a><span class="editFilter"></span>');
		h.push('<a class="bAdd" style="display:none;" href="javascript:void(0)">Add condition</a>');
		h.push('<a class="bDel" style="display:none;" href="javascript:void(0)">Cancel</a>');
		e.addClass('structuredSearch ui-widget-content ui-corner-all')
		    .html(h.join(''));
		e.find('.bPlus').button({
			text: false,
			icons: { secondary: 'ui-icon-plusthick'}
		}).click(function(e){ 
			if(that.state<0){
				that._setFilterField();
				that.state=0;
			}
		});
		e.find('.bAdd').button({
			text: false,
			icons: { secondary: 'ui-icon-check'	}
		}).click(function(evt){
			var idx=that._fMaxId++; 
			that.state=-1;  
			that._addFilter( idx, that._htmlFilter(idx, that._jsonFilterDef( idx)));
			that._removeFilterEditor();
			//that.trigger('filteradd');
		});
		e.find('.bDel').button({
			text: false,
			icons: { secondary: 'ui-icon-close'	}
		}).click(function(evt){ 
			that._removeFilterEditor();
		});
		e.find('#field').live('change', function(evt){
			if(that.state>1){
				e.find('#value').remove();
			}
			if(that.state>0){
				e.find('#operator').remove();
			}
			that.state=0;
			that._field=that._getFieldById($(evt.currentTarget).val())
			var fType=that._field.type;
			that._setFilterOperator(fType);
			if(fType==fieldTypes.lov || fType==fieldTypes.bool){
				that._setFilterValue(fType);
			}
			that._fType = fType;
			that.state=1;
		});
		e.find('#operator').live('change', function(evt){ 
			if(that.state<2){	
				that._setFilterValue(that._fType);
				that.state=2;
			}
		});
		
		// TEST BEGIN - to be removed
		var filterDef = {
			field:{
				label: 'Lastname',
				value: 'Lastname'
			},
			operator:{
				label: 'start w/',
				value: 'sw'
			}, 
			value:{
					label: 'Abc',
					value: 'Abc'
				}
		} 
		var idx=this._fMaxId++;
		that._addFilter( idx, that._htmlFilter(idx, filterDef));
		// TEST END 
    },
	
	_getFieldById: function(fId) {
		var fields=this.options.fields;
		for (var i=0,iMax=fields.length;i<iMax;i++){
			if(fields[i].id==fId){
				return fields[i];
			}
		}
		return null;
	},
	
	_removeFilterEditor: function() {
		var p=this.element.find('.editFilter').empty().parent();
		p.find('.bAdd,.bDel').hide();
		p.find('.bPlus').fadeIn();	
		this.state=-1; 
		if(this._cFilterTag){
			this._cFilterTag.button('enable').removeClass('ui-state-hover');
			this._cFilterTag=null;
		}
		//this.trigger('filterremove');		
	},
	
	_addFilter: function(idx, html) { 
		var that=this;
		if(this._cFilterTag){
			this._cFilterTag.button('enable').removeClass('ui-state-hover');
			this._enableFilterTag(html);
		}else{
			this._fMaxId++;
			this.element.find('div:first').prepend(['<a id="filter-',idx,'" data-type="',this._fType,'">',html,'</a>'].join(''))
			this.element.find('#filter-'+idx)
				.button({
					icons: { secondary: "ui-icon-close" }
				})
				.click(function(e){ 
					var $this=$(this),
						efs=$this.find('input[type="hidden"]');
					if(that._cFilterTag){
						that._enableFilterTag();
					}
					that._cFilterTag=$this;
					//that._removeFilterEditor();
					that._showFilter(efs[0].value, efs[1].value, efs[2].value);
					$this.button('disable');
				})
				.fadeIn() 
				.find('.ui-button-icon-secondary').click(function(e){
					e.stopPropagation();
					var filter=$(this).parent();
					if(!filter.hasClass('ui-state-disabled')){
						filter.fadeOut('slow',function() {
							filter.remove();
						});
					}
				})
		}
    }, 

	_jsonFilterDef: function( idx) {
		var e=this.element.find('.editFilter'),
			f=e.find('#field'),
			o=e.find('#operator'),
			v=e.find('#value'); 
		var filterDef = {
			field:{
				label: f.find('option:selected').text(),
				value: f.val()
			},
			operator:{},
			value:{}
		};
		if(this._fType==fieldTypes.lov){
			var vs=[], ls=[]; 
			this.element.find('#value').find('input:checked').each(function(){
				vs.push(this.value);
				ls.push(this.nextSibling.innerHTML);
			});
			filterDef.operator.label=EvolLang.sInList;
			filterDef.operator.value=soInList;
			filterDef.value.label='(' + ls.join(', ') + ')';
			filterDef.value.value=vs.join(',')
		}else if(this._fType==fieldTypes.bool){
			filterDef.operator.label=EvolLang.sEquals;
			filterDef.operator.value=soEqual;
			var val=(v.find('#value1').attr('checked')=='checked')?1:0;
			filterDef.value.label=(val==1)?EvolLang.yes:EvolLang.no;
			filterDef.value.value=val;
		}else{
			filterDef.operator.label=o.find('option:selected').text();
			filterDef.operator.value=o.val();
			filterDef.value.label='"' + v.val() + '"';
			filterDef.value.value=v.val();
		} 
		return filterDef;  
    },
	
	_htmlFilter: function( idx, filterDef) {
		return [ 
			'<span class="lBold">', filterDef.field.label,'</span> ', 
			'<span class="lLight">', filterDef.operator.label.toLowerCase(),'</span> ', 
			' <span class="lBold">', filterDef.value.label, '</span>',
			EvoUI.inputHidden('f-'+idx, filterDef.field.value),
			EvoUI.inputHidden('o-'+idx, filterDef.operator.value),
			EvoUI.inputHidden('v-'+idx, filterDef.value.value)
		].join('');
    },	
	
	_enableFilterTag: function(html) {
		if(this._cFilterTag){
			if(html){
				this._cFilterTag.find(':first-child').html(html);
			}
			this._cFilterTag.button('enable').removeClass('ui-state-hover');
			this._cFilterTag=null;
		}
    },
	
	_showFilter: function( f, o, v) {
		var fType = this._getFieldById(f).type;
	    this._setFilterField(f);
        this._setFilterOperator(fType, o);
        this._setFilterValue(fType, v);
        this.state=2;
	},
	
	_setFilterField: function(fid) {
		if(this.state<0){
			var fields=this.options.fields,
				h=[];
			h.push('<select class="evolField" id="field"><option value=""></option>'); 
			for (var i=0,iMax=fields.length;i<iMax;i++){
				var f=fields[i];
				h.push('<option value="',f.id,'">',f.label,'</option>');
			}
			h.push('</select>'); 
			var p=this.element.find('.editFilter').append(h.join('')).parent() 
			p.find('.bPlus').hide();
			p.find('.bDel').fadeIn();	
		}
		if(fid){
			this._field=this._getFieldById(fid);
		    this.element.find('#field').val(fid); 
		}
    },

	_setFilterOperator: function(fType, cond) {
		if(this.state<1){
			var h=[]; 
			switch (fType) {
				case fieldTypes.lov: 
					//h.push(EvolLang.anyOf);
					h.push(EvoUI.inputHidden('operator','in'));	
					break;
				case fieldTypes.bool:
				case fieldTypes.pix:
				case fieldTypes.doc: 
					//h.push(EvolLang.sEquals);
					h.push(EvoUI.inputHidden('operator',soEqual));	
					break;
				default: 
					h.push('<select class="evolOperator" id="operator">'); 
					h.push('<option value=""></option>');
					switch (fType) {
						case fieldTypes.date:
						case fieldTypes.datetime:
						case fieldTypes.time: 
							if (fType==fieldTypes.time){
								h.push(EvoUI.inputOption(soEqual, EvolLang.sAt));
							}else{
								h.push(EvoUI.inputOption(soEqual, EvolLang.sOn));
							}
							h.push(EvoUI.inputOption(soGreaterThan, EvolLang.sAfter))
							h.push(EvoUI.inputOption(soSmallerThan, EvolLang.sBefore));
							break;
	//					case fieldTypes.dec:
	//					case fieldTypes.integer:
	//						h.push('_c">', EvoUI.inputOption(soEqual, "&#61;"), EvoUI.inputOption(soGreaterThan, "&#62;", true), EvoUI.inputOption(soSmallerThan, "&#60;"));
	//						break;
						default:
							h.push(EvoUI.inputOption(soEqual, EvolLang.sEquals));
							h.push(EvoUI.inputOption(soStartWith, EvolLang.sStart));
							h.push(EvoUI.inputOption(soContain, EvolLang.sContain));
							h.push(EvoUI.inputOption(soFinishWith, EvolLang.sFinish)); 
							if (this.required!='1'){
								h.push(EvoUI.inputOption(soIsNull, EvolLang.sIsNull));
								h.push(EvoUI.inputOption(soIsNotNull, EvolLang.sIsNotNull));
							}
							break;
					}
					h.push("</select>");
					break;
			} 
			this.element.find('.editFilter').append(h.join(''));
		}
		if(cond){
		    this.element.find('#operator').val(cond); 
		}
    },
		
	_setFilterValue: function( fType, v) {
		this.id='value';
		function inputLOV2 ( fID, fV, fVLabel, fLOV){
			var fh=['<span id="',fID,'">']; 
			for(var i in fLOV){
				var lv=fLOV[i];
				fh.push(inputCheckbox(lv.id,lv.id));
				fh.push('<label for="',lv.id,'">',lv.label,'</label> ');
			} 	
			fh.push('</span>');		
			return fh.join('');
		};
		function inputCheckbox(fID,fV){
			var fh=['<input type="checkbox" id="',fID,'" value="',fV,'">'];
			return fh.join("");
		};
	
		if(this.state<2){
			var h=[];
			switch (fType) {
				case fieldTypes.text:
				case fieldTypes.txtm:
				case fieldTypes.html:
				case fieldTypes.email:
				case fieldTypes.url:
					//h.push(EvoUI.HTMLInputTextEmpty(fID));
					h.push('<input id="value" class="" type="text">');
					break;
				case fieldTypes.lov:
					h.push(inputLOV2('value','0','',this._field.list));
					break;
				case fieldTypes.bool: 
				case fieldTypes.pix:
				case fieldTypes.doc: 
					h.push('<span id="value">');
					h.push(EvoUI.inputRadio('value', '1', EvolLang.yes, false, this.id + '1'));
					h.push(EvoUI.inputRadio('value', '0', EvolLang.no, false, this.id + '0'));
					h.push('</span>');
					break;
				case fieldTypes.date:
				//case fieldTypes.datetime:
				//case fieldTypes.time:
					h.push('<input class="" type="text" id="value"/>');
					break;
	//					//Case fieldTypes.integer
	//					case fieldTypes.pix:
	//						h.push(EvoUI.HTMLInputCheckBox(fID, s1, EvolLang.wPix, false, fID));
	//						break;
	//					case fieldTypes.doc:
	//						h.push(EvoUI.HTMLInputCheckBox(fID, s1, EvolLang.wDoc, false, fID));
	//						break;
	//					case fieldTypes.integer:
				case fieldTypes.dec:
					h.push('<input class="" type="text" id="', this.id,'"/>');
	//						h.push("\" OnKeyUp=\"EvoVal.checkNum(this,'", fType.Substring(0, 1), "')\">");
					break;
				default:
					h.push('<input class="" type="text" id="', this.id,'"/>');
					break;
			}
			this.element.find('.editFilter').append(h.join('')); 
			if(fType==fieldTypes.date){
				this.element.find('#value').datepicker();
			}
		}
		if(v){
			var p=this.element.find('#value');
			switch (fType) {
				case fieldTypes.lov:
					p.find('#'+v.split(',').join(',#')).attr("checked", "checked");
					break;
				case fieldTypes.bool:
					p.find('#'+this.id+v).attr("checked", "checked");
					break;				
				default:
					p.val(v);
					break;
			}
		}
		this.element.find('.bAdd').fadeIn(); 
		return this;
    }, 

	val: function() {
		var v=[];
		this.element.find('div:first a').each(function(){
			var $this=$(this),
				vf = {};
			vf.label = this.innerText;
			var w=$this.find('input:first');
			vf.field=w.val();
			w=w.next();
			vf.operator=w.val();
			w=w.next();
			vf.value=w.val();
			v.push(vf);			
		})
        return v;
    },
	
	textVal: function() {
		var v=[];
		this.element.find('div:first a').each(function(){ 
			v.push(this.innerText);
		})
        return v.join(EvolLang.opAnd);
    },
	
    destroy: function() {
        this.element.empty()
			.removeClass('structuredSearch ui-widget-content ui-corner-all');
        $.Widget.prototype.destroy.call(this);
    }

});


var EvoUI={

	inputText:function(fID,fV,ml){
		var fh=['<input type="text" name="',fID,'" id="',fID,'" value="',fV];
		if(ml>0){
			fh.push('" maxlength="',ml);
		}	
		fh.push('" class="Field">');
		return fh.join('');
	},
	inputTextInt:function(fID,fV,fT,max,min){
		return ['<input type="text" name="',fID,'" id="',fID,'" value="',fV,
			'" onKeyUp="EvoVal.checkNum(this,\'',fT,'\')" class="Field" maxlength="12">'].join('');
	},
	inputDate:function(fID,fV){
		return ['<nobr><input type="text" id="',fID,'" name="',fID,'" value="',fV,'" class="Field Field80" size="15" maxlength="22">',
			'&nbsp;<a href="javascript:ShowDatePicker(\'',fID,'\');" class="ico Calendar"></a></nobr>'].join('');
	},
	inputCheckbox:function(fID,fV){
		var fh=['<input type="checkbox" id="',fID,'"'];
		if(fV!=null&&fV!=''&&fV!='0')
			fh.push(' checked');
		fh.push(' value="1">');
		return fh.join("");
	},
	inputRadio:function(fN,fV,fLbl,sel,fID){
		var fh=['<label for="',fID,'"><input ID="',fID,'" name="',fN,'" type="radio" value="',fV,'"'];
		if(sel){
			fh.push(' checked="checked"');
		}
		fh.push('">',fLbl,"</label>&nbsp;");
		return fh.join('');
	},
	inputHidden:function( id, val){
		return ['<input type="hidden" name="',id,'" id="',id,'" value="',val,'"/>'].join('');
	},
	inputOption:function(fID,fV){
		return ['<option value="',fID,'">',fV,'</option>'].join('');
	} 
	
}

})(jQuery);

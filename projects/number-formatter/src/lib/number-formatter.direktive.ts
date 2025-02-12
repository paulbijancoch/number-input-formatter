import {
  Directive,
  ElementRef,
  HostListener,
  forwardRef,
  Input,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { formatNumber, registerLocaleData } from '@angular/common';

import de from '@angular/common/locales/de';
registerLocaleData(de);

export interface INumberInputFormatter {
  locale: 'de_DE';
  thousand_seperator: '.';
  decimal_seperator: ',';
}

@Directive({
  selector: '[numberFormat]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberInputFormatterDirective),
      multi: true,
    },
  ],
})
export class NumberInputFormatterDirective implements ControlValueAccessor {
  @Input()
  set numberFormat(format: Partial<INumberInputFormatter>) {
    if (format?.locale) this.locale = format?.locale;
    if (format?.thousand_seperator)
      this.thousand_seperator = format?.thousand_seperator;
    if (format?.decimal_seperator)
      this.decimal_seperator = format?.decimal_seperator;
  }

  private el: HTMLInputElement;
  private _number: number | null = null;
  private _value: string | null = null;

  private locale = 'de_DE';
  private thousand_seperator = '.';
  private decimal_seperator = ',';

  constructor(public hostElement: ElementRef) {
    this.el = this.hostElement.nativeElement;
  }

  get value(): number | null {
    return this._number;
  }

  @HostListener('input', ['$event'])
  change($event: any) {
    let item = $event.target;
    let pos = item.selectionStart;
    this.onBlur(item.value);
    if (this._value?.[pos] === '.') pos++;
    else if (this._value?.[pos] === ',') {
      if (this._value?.[pos + 1] === '0') pos--;
      else pos++;
    } else if (this._value?.[pos - 1] === ',') pos--;
    else if (this._value?.[pos - 2] === ',') pos--;
    this.el.setSelectionRange(pos + 1, pos + 1);
  }

  @HostListener('blur', ['$event.target.value'])
  onBlur(value: string) {
    this._number = this.parseValue(this.formatValue(this.parseValue(value)));
    this._value = this.formatValue(this._number);
    this._onChange(this._number);
    if (value != null) this.hostElement.nativeElement.value = this._value;
  }

  writeValue(value: number | string) {
    if (typeof value === 'number') this._number = value;
    else this._number = this.parseValue(value);
    this._value = this.formatValue(this._number);
    if (value != null) this.hostElement.nativeElement.value = this._value;
  }

  private parseValue(value: string | null) {
    if (!value) return null;
    value = value
      ?.toString()
      .split(this.thousand_seperator)
      .join('')
      .split(this.decimal_seperator)
      .join(this.thousand_seperator);
    return Number.parseFloat(value);
  }

  private formatValue(value: number | null) {
    if (!value) return null;
    return formatNumber(Number(value), this.locale, '1.2-2');
  }

  _onChange(value: any): void {}

  registerOnChange(fn: (value: any) => void) {
    this._onChange = fn;
  }

  registerOnTouched() {}
}

'use strict';

const parse = require('../parse');

describe('parse TD1', () => {
  it('swiss ID - valid', () => {
    const data = [
      'IDCHEA1234567<6<<<<<<<<<<<<<<<',
      '7510256M2009018CHE<<<<<<<<<<<8',
      'SMITH<<JOHN<ALBERT<<<<<<<<<<<<'
    ];

    const result = parse(data);
    expect(result).toMatchObject({
      format: 'TD1',
      valid: true
    });
    expect(result.fields).toStrictEqual({
      documentCode: 'ID',
      issuingState: 'CHE',
      documentNumber: 'A1234567',
      documentNumberCheckDigit: '6',
      birthDate: '751025',
      birthDateCheckDigit: '6',
      sex: 'male',
      expirationDate: '200901',
      expirationDateCheckDigit: '8',
      nationality: 'CHE',
      optional1: '',
      optional2: '',
      compositeCheckDigit: '8',
      lastName: 'SMITH',
      firstName: 'JOHN ALBERT'
    });

    const optional1Details = result.details.find(
      (f) => f.field === 'optional1'
    );
    expect(optional1Details).toMatchObject({
      value: '',
      line: 0,
      start: 15,
      end: 15
    });
  });

  it('Utopia example', () => {
    const MRZ = [
      'I<UTOD231458907ABC<<<<<<<<<<<<',
      '7408122F1204159UTO<<<<<<<<<<<1',
      'ERIKSSON<<ANNA<MARIA<<<<<<<<<<'
    ];

    const result = parse(MRZ);
    expect(result.details.filter((a) => !a.valid)).toHaveLength(2);
    expect(result.fields).toStrictEqual({
      firstName: 'ANNA MARIA',
      lastName: 'ERIKSSON',
      nationality: null,
      issuingState: null,
      documentCode: 'I',
      documentNumber: 'D23145890',
      documentNumberCheckDigit: '7',
      birthDate: '740812',
      birthDateCheckDigit: '2',
      expirationDate: '120415',
      expirationDateCheckDigit: '9',
      sex: 'female',
      optional1: 'ABC',
      optional2: '',
      compositeCheckDigit: '1'
    });
    expect(result.valid).toStrictEqual(false);
    expect(
      result.details.find((a) => a.field === 'issuingState').valid
    ).toStrictEqual(false);

    const optional1 = result.details.find((a) => a.field === 'optional1');
    expect(optional1).toMatchObject({
      value: 'ABC',
      line: 0,
      start: 15,
      end: 18
    });

    const optional2 = result.details.find((a) => a.field === 'optional2');
    expect(optional2).toMatchObject({
      value: '',
      line: 1,
      start: 18,
      end: 18
    });
  });

  it('parse document number', () => {
    const MRZ = [
      'I<UTOD23145890<1240<XYZ<<<<<<<',
      '7408122F1204159UTO<<<<<<<<<<<8',
      'ERIKSSON<<ANNA<MARIA<<<<<<<<<<'
    ];
    const result = parse(MRZ);
    expect(result.valid).toBe(false);
    expect(result.details.filter((f) => !f.valid)).toHaveLength(2);
    const documentNumberDetails = result.details.find(
      (d) => d.field === 'documentNumber'
    );
    expect(documentNumberDetails).toStrictEqual({
      label: 'Document number',
      field: 'documentNumber',
      value: 'D23145890124',
      valid: true,
      ranges: [
        { line: 0, start: 5, end: 14, raw: 'D23145890' },
        { line: 0, start: 14, end: 15, raw: '<' },
        { line: 0, start: 15, end: 30, raw: '1240<XYZ<<<<<<<' }
      ],
      line: 0,
      start: 5,
      end: 18
    });
    expect(result.fields.documentNumber).toStrictEqual('D23145890124');
    expect(result.fields.documentNumberCheckDigit).toStrictEqual('0');

    const documentNumberCheckDigitDetails = result.details.find(
      (d) => d.field === 'documentNumberCheckDigit'
    );
    expect(documentNumberCheckDigitDetails).toMatchObject({
      line: 0,
      start: 18,
      end: 19,
      value: '0'
    });
  });

  it('Not filled nationality example', () => {
    const MRZ = [
      'I<UTOD231458907ABC<<<<<<<<<<<<',
      '7408122F1204159<<<<<<<<<<<<<<1',
      'ERIKSSON<<ANNA<MARIA<<<<<<<<<<'
    ];

    const result = parse(MRZ);
    expect(result.details.filter((a) => !a.valid)).toHaveLength(1);
    expect(result.fields).toStrictEqual({
      firstName: 'ANNA MARIA',
      lastName: 'ERIKSSON',
      nationality: '',
      issuingState: null,
      documentCode: 'I',
      documentNumber: 'D23145890',
      documentNumberCheckDigit: '7',
      birthDate: '740812',
      birthDateCheckDigit: '2',
      expirationDate: '120415',
      expirationDateCheckDigit: '9',
      sex: 'female',
      optional1: 'ABC',
      optional2: '',
      compositeCheckDigit: '1'
    });
  });

  it('digits in names', () => {
    const MRZ = [
      'I<UTOD23145890<1240<XYZ<<<<<<<',
      '7408122F1204159UTO<<<<<<<<<<<8',
      'KOZLOVSKA8<<L7DMILA<PETROVNA<<'
    ];
    const result = parse(MRZ);
    expect(result.fields.firstName).toStrictEqual('L7DMILA PETROVNA');
    expect(result.fields.lastName).toStrictEqual('KOZLOVSKA8');
  });

  it('space in document number', () => {
    const MRZ = [
      'I<UTO592988362<0804<<<<<<<<<<<',
      '7408122F1204159UTO<<<<<<<<<<<8',
      'ERIKSSON<<ANNA<MARIA<<<<<<<<<<'
    ];
    const result = parse(MRZ);
    expect(result.fields.documentNumber).toStrictEqual('592988362080');
    expect(result.fields.documentNumberCheckDigit).toStrictEqual('4');
  });

  it('empty expiration date', () => {
    const MRZ = [
      'PNRUSAAAAAAA<<AAAAAA<AAAAAAAAAA<<<<<<<<<<<<<',
      '1111111113RUS0202022M<<<<<<<1111111111111<14',
    ];
    const result = parse(MRZ);
    expect(result.valid).toStrictEqual(true);
  });

  it('zero in nationality', () => {
    const MRZ = [
      'IDROUAAAAAAAA<<AAAAAA<AAAAAA<<<<<<<<',
      'C1111111<1R0U1111111M111111111111111',
    ];
    const result = parse(MRZ);
    expect(result.fields.nationality).toStrictEqual('ROU');
  });

  it('valid id card', function () {
    const MRZ = [
      'RPESTBB00308371<<<<<<<<<<<<<<<',
      '8511294M2204053RUS<<<<<<<<<<<2',
      'POPOV<<VLADIMIR<<<<<<<<<<<<<<<',
    ];
    var result = parse(MRZ);
    // expect(result.valid).toEqual(true);
    expect(result.details.filter((a) => !a.valid)).toHaveLength(0);
    expect(result.fields).toStrictEqual({
      birthDate: '851129',
      birthDateCheckDigit: '4',
      compositeCheckDigit: '2',
      documentCode: 'RP',
      documentNumber: 'BB0030837',
      documentNumberCheckDigit: '1',
      expirationDate: '220405',
      expirationDateCheckDigit: '3',
      firstName: 'VLADIMIR',
      issuingState: 'EST',
      lastName: 'POPOV',
      nationality: 'RUS',
      optional1: '',
      optional2: '',
      sex: 'male',
    });
  });
});

/*
MIT License

Copyright (c) 2018 Ángel Paredes

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

// https://github.com/peoplenarthax/jest-mock-random

// Warning in case the passed value is not a decimal
// eslint-disable-next-line no-console
const showWarning = () =>
  console.warn(
    'WARNING: The value that you are using to mock random is not a decimal and it is breaking the real contract'
  );
const isDecimal = (n: unknown) =>
  typeof n === 'number' && (n === 0 || (!Number.isNaN(n) && n % 1 !== 0));
const warnBrokenContract = (values: number[]) => {
  if (!values.every(isDecimal)) {
    showWarning();
  }
};

// Copy the global Math object in order to reset it
const mathCopy = Object.create(global.Math);
export const resetMockRandom = () => {
  global.Math = mathCopy;
};

// randomMock implementation
const randomMock = (returnValues: number[] | number) => {
  const arrayOfValues = Array.isArray(returnValues)
    ? returnValues
    : [returnValues];

  let index = 0;

  return () => {
    if (arrayOfValues.length === 0) {
      throw new TypeError('The value list must contain some value');
    }
    warnBrokenContract(arrayOfValues);
    if (index >= arrayOfValues.length) {
      index = 0;
    }
    return arrayOfValues[index++];
  };
};
// Through a copy of the global Math object we mock the random method
export const mockRandom = (values: number[] | number) => {
  const mockMath = Object.create(global.Math);
  mockMath.random = randomMock(values);
  global.Math = mockMath;
};

// When mockRandomWith is called it create the mock beforeEach and reset it after
export const mockRandomForEach = (valuesArray: number[]) => {
  // eslint-disable-next-line no-undef
  beforeEach(() => {
    mockRandom(valuesArray);
  });
  // eslint-disable-next-line no-undef
  afterEach(() => {
    resetMockRandom();
  });
};

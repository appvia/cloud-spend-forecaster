import { generate } from '../src/generate_request_data'

describe('generate_request_data', () => {
  it('generate with 2 with increasing numbers', () =>
    expect(
      generate(
        [
          { time: 100, requests: 1 },
          { time: 1000, requests: 10000 },
        ],
        10,
      ),
    ).toMatchSnapshot())
  it('generate with 2 with decreasing numbers', () =>
    expect(
      generate(
        [
          { time: 100, requests: 10000 },
          { time: 1000, requests: 1 },
        ],
        10,
      ),
    ).toMatchSnapshot())

  it('generate with increasing and decreasing', () =>
    expect(
      generate(
        [
          { time: 0, requests: 100 },
          { time: 100, requests: 10000 },
          { time: 1000, requests: 1 },
        ],
        10,
      ),
    ).toMatchSnapshot())
})

import {expect, test} from '@oclif/test'

describe('oci:availability:records', () => {
  test
  .stdout()
  .command(['oci:availability:records'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['oci:availability:records', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})

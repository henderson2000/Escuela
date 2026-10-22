export interface JavaDiagnostic {
  severity: string
  message: string
  line: number
  file: string
}
export interface CompileRequest {
  entry: string
  files: { path: string; content: string }[]
  optimization: 'debug' | 'release'
}
export interface CompileResult {
  success: boolean
  stderr: string
  diagnostics: JavaDiagnostic[]
  wasm?: Uint8Array
}
export type JavaCompilerLib = unknown
export function loadCompiler(wasm: Uint8Array): Promise<JavaCompilerLib>
export function compileJava(lib: JavaCompilerLib, req: CompileRequest, assets: { sdk: Uint8Array; runtime: Uint8Array }): Promise<CompileResult>

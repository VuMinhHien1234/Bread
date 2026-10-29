/**
 * Ô bẫy cho bot: người thật không nhìn thấy nên không điền. Trình đọc màn hình và phím Tab bỏ qua.
 * Server coi form có chữ trong ô này là spam (TASK-BE mục 6.1).
 */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

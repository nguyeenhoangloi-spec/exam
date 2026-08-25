import api from './api';

/** Render a published server-side document template and open the browser print dialog. */
export async function printDocumentTemplate(
  code: string,
  filters: Record<string, string | number | boolean | undefined> = {},
): Promise<boolean> {
  const printable = window.open('', '_blank', 'width=980,height=780');
  if (!printable) return false;
  try {
    const response = await api.post(`/document-templates/${code}/render`, { filters });
    printable.document.write(response.data.html);
    printable.document.close();
    printable.onload = () => printable.print();
    return true;
  } catch (error) {
    printable.close();
    throw error;
  }
}

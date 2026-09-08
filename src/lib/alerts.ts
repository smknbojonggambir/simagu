import Swal from 'sweetalert2';

export const showAlert = {
  success: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      timer: 2500,
      showConfirmButton: false,
      iconColor: '#16A34A',
      customClass: {
        popup: 'rounded-2xl dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-xl',
        title: 'text-base font-bold text-[#163A5F] dark:text-white',
        htmlContainer: 'text-xs text-slate-600 dark:text-slate-300'
      }
    });
  },

  error: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'error',
      title,
      text: text || 'Terjadi kesalahan sistem. Silakan coba kembali.',
      confirmButtonColor: '#DC2626',
      iconColor: '#DC2626',
      confirmButtonText: 'Tutup',
      customClass: {
        popup: 'rounded-2xl dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-xl',
        title: 'text-base font-bold text-[#163A5F] dark:text-white',
        htmlContainer: 'text-xs text-slate-600 dark:text-slate-300',
        confirmButton: 'px-4 py-2 rounded-xl text-xs font-bold'
      }
    });
  },

  warning: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonColor: '#F59E0B',
      iconColor: '#F59E0B',
      confirmButtonText: 'Mengerti',
      customClass: {
        popup: 'rounded-2xl dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-xl',
        title: 'text-base font-bold text-[#163A5F] dark:text-white',
        htmlContainer: 'text-xs text-slate-600 dark:text-slate-300',
        confirmButton: 'px-4 py-2 rounded-xl text-xs font-bold'
      }
    });
  },

  info: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'info',
      title,
      text,
      confirmButtonColor: '#2563EB',
      iconColor: '#2563EB',
      confirmButtonText: 'OK',
      customClass: {
        popup: 'rounded-2xl dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-xl',
        title: 'text-base font-bold text-[#163A5F] dark:text-white',
        htmlContainer: 'text-xs text-slate-600 dark:text-slate-300',
        confirmButton: 'px-4 py-2 rounded-xl text-xs font-bold'
      }
    });
  },

  confirmDelete: async (title: string, text?: string): Promise<boolean> => {
    const result = await Swal.fire({
      title: title || 'Apakah Anda yakin?',
      text: text || 'Data yang dihapus tidak dapat dikembalikan!',
      icon: 'warning',
      iconColor: '#DC2626',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Ya, Hapus Data',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-2xl dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-xl',
        title: 'text-base font-bold text-[#163A5F] dark:text-white',
        htmlContainer: 'text-xs text-slate-600 dark:text-slate-300',
        confirmButton: 'px-4 py-2 rounded-xl text-xs font-bold bg-[#DC2626] text-white',
        cancelButton: 'px-4 py-2 rounded-xl text-xs font-semibold'
      }
    });
    return result.isConfirmed;
  },

  loading: (title: string, text?: string) => {
    Swal.fire({
      title,
      text: text || 'Mohon tunggu sebentar...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: 'rounded-2xl dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-xl',
        title: 'text-sm font-bold text-[#163A5F] dark:text-white',
        htmlContainer: 'text-xs text-slate-500 dark:text-slate-400'
      }
    });
  },

  close: () => {
    Swal.close();
  }
};


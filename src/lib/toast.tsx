import { toast } from 'react-toastify';
import React from 'react';

interface ToastContentProps {
  title: string;
  message: string;
}

const ToastContent: React.FC<ToastContentProps> = ({ title, message }) => (
  <div className="flex flex-col gap-0.5">
    <p className="font-bold text-[13px] text-white leading-tight">{title}</p>
    <p className="text-[11px] opacity-70 font-medium leading-tight">{message}</p>
  </div>
);

export const showToast = {
  success: (title: string, message: string) => {
    toast.success(<ToastContent title={title} message={message} />);
  },
  error: (title: string, message: string) => {
    toast.error(<ToastContent title={title} message={message} />);
  },
  warning: (title: string, message: string) => {
    toast.warning(<ToastContent title={title} message={message} />);
  },
  info: (title: string, message: string) => {
    toast.info(<ToastContent title={title} message={message} />);
  },
};

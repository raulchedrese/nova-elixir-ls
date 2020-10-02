export const folderPath = (uri: string, workspacePath: string) => {
  const workspaceRelativePath = uri.split(workspacePath).pop();

  // Remove the "/" from the start and the file name from the end.
  return workspaceRelativePath.split("/").slice(1, -1).join("/") + "/";
};

export const fileName = (uri: string) => uri.split("/").pop();

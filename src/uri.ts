export const folderPath = (uri, workspacePath) => {
  const workspaceRelativePath = uri.split(workspacePath).pop();

  // Remove the "/" from the start and the file name from the end.
  return workspaceRelativePath.split("/").slice(1, -1).join("/") + "/";
};
